import { notFound } from 'next/navigation'
import Link from 'next/link'

import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

import { VakmanEditForm } from './VakmanEditForm'
import { VakmanActions } from './VakmanActions'
import styles from '../../shared.module.css'

export const metadata = { title: 'Vakman bewerken' }
export const dynamic = 'force-dynamic'

type Params = { id: string }

export default async function VakmanDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params

  const tp = await prisma.tradesperson.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      companyName: true,
      kvkNumber: true,
      kvkVerified: true,
      kvkVerifiedAt: true,
      description: true,
      email: true,
      emailHash: true,
      phone: true,
      websiteUrl: true,
      hourlyRateMin: true,
      hourlyRateMax: true,
      foundedYear: true,
      teamSize: true,
      marketFocus: true,
      emergencyService: true,
      qualityScore: true,
      profileActive: true,
      profileClaimed: true,
      profileClaimedAt: true,
      tier: true,
      featured: true,
      city: { select: { name: true, slug: true } },
      trades: {
        select: {
          isPrimary: true,
          trade: { select: { nameSingular: true, slug: true } },
        },
      },
      ratingAvg: true,
      ratingCount: true,
      googleRating: true,
      googleReviewsCount: true,
      reviewNeeded: true,
      phoneInvalid: true,
      emailDnsInvalid: true,
      websiteStatus: true,
      sourcesUsed: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!tp) notFound()

  let plainEmail: string | null = null
  if (tp.email) {
    try {
      plainEmail = decrypt(tp.email)
    } catch {
      plainEmail = null
    }
  }

  // Audit-trail: laatste 10 ADMIN-events met deze tradespersonId
  const auditTrail = await prisma.complianceLog.findMany({
    where: {
      eventType: { startsWith: 'ADMIN_' },
      // Prisma JSON path-equality search via raw — simpel filter via metadata.tradespersonId
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, eventType: true, createdAt: true, metadata: true },
  })
  const relevantTrail = auditTrail
    .filter((l) => {
      const m = l.metadata as Record<string, unknown> | null
      return m?.tradespersonId === tp.id
    })
    .slice(0, 10)

  const fmtDate = new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>
          <Link href="/admin/vakmensen">← Terug naar lijst</Link>
        </p>
        <h1 className={styles.h1}>{tp.companyName}</h1>
        <p className={styles.lede}>
          KvK {tp.kvkNumber ?? '—'} · {tp.city?.name ?? '—'} ·{' '}
          <Link href={`/vakman/${tp.slug}`} target="_blank">
            Publiek profiel ↗
          </Link>
        </p>
      </header>

      <section>
        <h2 className={styles.h2}>Status</h2>
        <div className={styles.statGrid}>
          <Stat
            label="Profiel"
            value={tp.profileActive ? 'Zichtbaar' : 'Verborgen'}
            color={tp.profileActive ? undefined : 'var(--accent)'}
          />
          <Stat
            label="Geclaimd"
            value={tp.profileClaimed ? 'Ja' : 'Nee'}
            color={tp.profileClaimed ? '#065f46' : undefined}
          />
          <Stat
            label="KvK-verificatie"
            value={tp.kvkVerified ? 'Verified' : 'Niet verified'}
            color={tp.kvkVerified ? '#065f46' : undefined}
          />
          <Stat label="Quality score" value={tp.qualityScore} />
          <Stat label="Tier" value={tp.tier} />
          <Stat
            label="Reviews"
            value={
              tp.ratingAvg != null
                ? `${tp.ratingAvg.toFixed(1)} (${tp.ratingCount})`
                : tp.googleRating != null
                  ? `${tp.googleRating.toFixed(1)} G (${tp.googleReviewsCount})`
                  : '—'
            }
          />
        </div>
      </section>

      <section>
        <h2 className={styles.h2}>Contact (decrypted voor admin)</h2>
        <div className={styles.formBlock}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>E-mail</span>
            <code style={{ fontSize: 14 }}>
              {plainEmail ?? '(geen e-mail of niet ontsleutelbaar)'}
            </code>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Telefoon</span>
            <code style={{ fontSize: 14 }}>{tp.phone ?? '—'}</code>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Website</span>
            <code style={{ fontSize: 14 }}>{tp.websiteUrl ?? '—'}</code>{' '}
            {tp.websiteStatus && tp.websiteStatus !== 'ok' && (
              <span className={`${styles.badge} ${styles.badgeWarn}`}>{tp.websiteStatus}</span>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className={styles.h2}>Acties</h2>
        <VakmanActions
          tradespersonId={tp.id}
          profileClaimed={tp.profileClaimed}
          kvkVerified={tp.kvkVerified}
          plainEmail={plainEmail}
          companyName={tp.companyName}
        />
      </section>

      <section>
        <h2 className={styles.h2}>Bewerken</h2>
        <VakmanEditForm
          tradespersonId={tp.id}
          initial={{
            companyName: tp.companyName,
            description: tp.description,
            phone: tp.phone,
            websiteUrl: tp.websiteUrl,
            hourlyRateMin: tp.hourlyRateMin,
            hourlyRateMax: tp.hourlyRateMax,
            emergencyService: tp.emergencyService,
            qualityScore: tp.qualityScore,
            tier: tp.tier,
            featured: tp.featured,
            profileActive: tp.profileActive,
          }}
        />
      </section>

      <section>
        <h2 className={styles.h2}>Audit trail (10 recent)</h2>
        {relevantTrail.length === 0 ? (
          <div className={styles.empty}>Nog geen admin-acties op dit profiel.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Wanneer</th>
                <th>Actie</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {relevantTrail.map((l) => {
                const m = (l.metadata ?? {}) as Record<string, unknown>
                return (
                  <tr key={l.id}>
                    <td style={{ fontSize: 12 }}>{fmtDate.format(l.createdAt)}</td>
                    <td>
                      <span className={styles.badge}>{l.eventType}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {m.adminId ? `door ${String(m.adminId).slice(0, 8)}…` : ''}
                      {m.fields ? ` · ${(m.fields as string[]).join(', ')}` : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue} style={{ color, fontSize: 22 }}>
        {value}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}
