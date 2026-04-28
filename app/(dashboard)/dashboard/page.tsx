import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

import styles from './shared.module.css'

export const metadata: Metadata = {
  title: 'Overzicht',
  robots: { index: false, follow: false },
}

const DAYS = 30

export default async function OverviewPage() {
  const session = await auth()
  if (!session?.user.tradespersonId) {
    redirect('/dashboard/welkom')
  }

  const tradespersonId = session.user.tradespersonId
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000)

  const [tp, eventCounts, photosCount, unrespondedReviews] = await Promise.all([
    prisma.tradesperson.findUnique({
      where: { id: tradespersonId },
      select: {
        companyName: true,
        availabilityUpdatedAt: true,
        availabilityStatus: true,
      },
    }),
    prisma.pageView.groupBy({
      by: ['eventType'],
      where: { tradespersonId, createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.tradespersonPhoto.count({ where: { tradespersonId } }),
    prisma.review.count({
      where: {
        tradespersonId,
        status: 'APPROVED',
        ownerResponse: null,
      },
    }),
  ])

  const counts = Object.fromEntries(eventCounts.map((e) => [e.eventType, e._count._all]))

  const availabilityAge = tp?.availabilityUpdatedAt
    ? Math.floor((Date.now() - tp.availabilityUpdatedAt.getTime()) / (24 * 60 * 60 * 1000))
    : null

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Overzicht</p>
        <h1 className={styles.h1}>Welkom, {tp?.companyName ?? 'vakman'}</h1>
        <p className={styles.lede}>Statistieken van de afgelopen {DAYS} dagen.</p>
      </header>

      <section className={styles.statGrid}>
        <Stat label="Profielweergaven" value={counts.PROFILE_VIEW ?? 0} />
        <Stat label="Telefoon-clicks" value={counts.PHONE_CLICK ?? 0} />
        <Stat label="Website-clicks" value={counts.WEBSITE_CLICK ?? 0} />
        <Stat label="E-mail-clicks" value={counts.EMAIL_CLICK ?? 0} />
      </section>

      <section className={styles.todoBlock}>
        <h2 className={styles.h2}>Volgende stappen</h2>
        <ul className={styles.todoList}>
          {photosCount < 3 && (
            <li>
              <Link href="/dashboard/fotos">
                Voeg minimaal {3 - photosCount} foto’s toe ({photosCount}/3)
              </Link>
            </li>
          )}
          {(availabilityAge === null || availabilityAge >= 14) && (
            <li>
              <Link href="/dashboard/beschikbaarheid">
                Update uw beschikbaarheid
                {availabilityAge !== null ? ` (${availabilityAge} dagen oud)` : ''}
              </Link>
            </li>
          )}
          {unrespondedReviews > 0 && (
            <li>
              <Link href="/dashboard/reviews">
                Reageer op {unrespondedReviews} review
                {unrespondedReviews === 1 ? '' : 's'}
              </Link>
            </li>
          )}
          {photosCount >= 3 &&
            availabilityAge !== null &&
            availabilityAge < 14 &&
            unrespondedReviews === 0 && (
              <li className={styles.todoDone}>✓ Uw profiel is up-to-date — niets te doen.</li>
            )}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{new Intl.NumberFormat('nl-NL').format(value)}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}
