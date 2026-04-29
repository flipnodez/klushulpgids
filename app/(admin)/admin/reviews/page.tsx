import Link from 'next/link'
import { clsx } from 'clsx'
import type { Prisma, ReviewStatus } from '@prisma/client'

import { prisma } from '@/lib/db'
import { Stars } from '@/components/ui/Stars'

import { ReviewActions } from './ReviewActions'
import styles from '../shared.module.css'

export const metadata = { title: 'Reviews queue' }
export const dynamic = 'force-dynamic'

type Tab = 'pending' | 'flagged' | 'approved' | 'rejected'

function isTab(v: string | undefined): v is Tab {
  return v === 'pending' || v === 'flagged' || v === 'approved' || v === 'rejected'
}

export default async function ReviewsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const sp = await searchParams
  const tab: Tab = isTab(sp.tab) ? sp.tab : 'pending'

  const [counts, items] = await Promise.all([
    Promise.all([
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { flagged: true, status: 'APPROVED' } }),
    ]),
    fetchReviewsForTab(tab),
  ])
  const [pendingCount, flaggedCount] = counts

  const fmtDate = new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Admin · Reviews</p>
        <h1 className={styles.h1}>Reviews queue</h1>
        <p className={styles.lede}>Goedkeuren, afwijzen, of als spam markeren.</p>
      </header>

      <nav className={styles.tabs}>
        <Tab label="Pending" tab="pending" current={tab} count={pendingCount} />
        <Tab label="Flagged" tab="flagged" current={tab} count={flaggedCount} />
        <Tab label="Approved" tab="approved" current={tab} />
        <Tab label="Rejected" tab="rejected" current={tab} />
      </nav>

      {items.length === 0 ? (
        <div className={styles.empty}>Geen reviews in deze tab.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {items.map((r) => (
            <article key={r.id} className={styles.section}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 'var(--sp-4)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Stars rating={r.rating} />
                    <strong>{r.reviewerName}</strong>
                    {r.reviewerCity && (
                      <span style={{ color: 'var(--muted)' }}>· {r.reviewerCity}</span>
                    )}
                    <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                      · {fmtDate.format(r.createdAt)}
                    </span>
                    <span className={styles.badge}>{r.verificationMethod}</span>
                    {r.flagged && (
                      <span className={`${styles.badge} ${styles.badgeWarn}`}>FLAGGED</span>
                    )}
                  </div>
                  {r.title && (
                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, margin: '8px 0 4px' }}>
                      {r.title}
                    </h3>
                  )}
                  <p
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 15,
                      lineHeight: 1.5,
                      margin: '8px 0 0',
                      color: 'var(--ink-2)',
                    }}
                  >
                    {r.body}
                  </p>
                  {r.flagReason && (
                    <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8 }}>
                      <strong>Flag-reden:</strong> {r.flagReason}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
                    Vakman:{' '}
                    <Link href={`/admin/vakmensen/${r.tradesperson.id}`}>
                      {r.tradesperson.companyName}
                    </Link>{' '}
                    {r.tradesperson.city && <span>· {r.tradesperson.city.name}</span>} ·{' '}
                    <Link href={`/vakman/${r.tradesperson.slug}`} target="_blank">
                      publiek profiel ↗
                    </Link>
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    IP: <code>{r.ipAddressHash?.slice(0, 12) ?? 'n/a'}…</code> · Email-hash:{' '}
                    <code>{r.reviewerEmailHash?.slice(0, 12) ?? 'n/a'}…</code>
                  </p>
                </div>
                <ReviewActions
                  reviewId={r.id}
                  status={r.status}
                  flagged={r.flagged}
                  tradespersonSlug={r.tradesperson.slug}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function Tab({
  label,
  tab,
  current,
  count,
}: {
  label: string
  tab: 'pending' | 'flagged' | 'approved' | 'rejected'
  current: 'pending' | 'flagged' | 'approved' | 'rejected'
  count?: number
}) {
  return (
    <Link
      href={`/admin/reviews?tab=${tab}`}
      className={clsx(styles.tab, current === tab && styles.tabActive)}
    >
      {label}
      {count !== undefined && count > 0 && <span className={styles.tabBadge}>{count}</span>}
    </Link>
  )
}

async function fetchReviewsForTab(tab: 'pending' | 'flagged' | 'approved' | 'rejected') {
  const baseSelect = {
    id: true,
    reviewerName: true,
    reviewerCity: true,
    reviewerEmailHash: true,
    ipAddressHash: true,
    rating: true,
    title: true,
    body: true,
    verificationMethod: true,
    status: true,
    flagged: true,
    flagReason: true,
    createdAt: true,
    tradesperson: {
      select: {
        id: true,
        slug: true,
        companyName: true,
        city: { select: { name: true } },
      },
    },
  } satisfies Prisma.ReviewSelect

  const where: Prisma.ReviewWhereInput =
    tab === 'pending'
      ? { status: 'PENDING' }
      : tab === 'flagged'
        ? { flagged: true, status: 'APPROVED' }
        : tab === 'approved'
          ? { status: 'APPROVED', flagged: false }
          : { status: 'REJECTED' }

  return prisma.review.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: baseSelect,
  }) as Promise<
    Array<{
      id: string
      reviewerName: string
      reviewerCity: string | null
      reviewerEmailHash: string | null
      ipAddressHash: string | null
      rating: number
      title: string | null
      body: string
      verificationMethod: string
      status: ReviewStatus
      flagged: boolean
      flagReason: string | null
      createdAt: Date
      tradesperson: {
        id: string
        slug: string
        companyName: string
        city: { name: string } | null
      }
    }>
  >
}
