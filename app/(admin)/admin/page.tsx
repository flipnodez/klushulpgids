import Link from 'next/link'

import { prisma } from '@/lib/db'

import styles from './shared.module.css'

export const metadata = { title: 'Overzicht' }

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function startOfWeek(d = new Date()) {
  const x = startOfDay(d)
  x.setDate(x.getDate() - 7)
  return x
}

export default async function AdminDashboardPage() {
  const todayStart = startOfDay()
  const weekStart = startOfWeek()

  const [
    profilesToday,
    reviewsToday,
    reviewsApprovedToday,
    reviewsPendingTotal,
    reviewsFlaggedTotal,
    profilesClaimedToday,
    deleteRequestsThisWeek,
    profileViewsWeek,
    phoneClicksWeek,
  ] = await Promise.all([
    prisma.tradesperson.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.review.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.review.count({
      where: { status: 'APPROVED', approvedAt: { gte: todayStart } },
    }),
    prisma.review.count({ where: { status: 'PENDING' } }),
    prisma.review.count({ where: { flagged: true, status: 'APPROVED' } }),
    prisma.tradesperson.count({ where: { profileClaimedAt: { gte: todayStart } } }),
    prisma.complianceLog.count({
      where: {
        eventType: { in: ['PROFILE_DELETED', 'PROFILE_DELETED_VIA_UNSUBSCRIBE'] },
        createdAt: { gte: weekStart },
      },
    }),
    prisma.pageView.count({
      where: { eventType: 'PROFILE_VIEW', createdAt: { gte: weekStart } },
    }),
    prisma.pageView.count({
      where: { eventType: 'PHONE_CLICK', createdAt: { gte: weekStart } },
    }),
  ])

  const recentLogs = await prisma.complianceLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, eventType: true, createdAt: true, metadata: true },
  })

  const fmtDate = new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Admin · Overzicht</p>
        <h1 className={styles.h1}>Dashboard</h1>
        <p className={styles.lede}>Realtime statistieken en pending tasks.</p>
      </header>

      <section>
        <h2 className={styles.h2}>Vandaag</h2>
        <div className={styles.statGrid}>
          <Stat label="Nieuwe profielen" value={profilesToday} />
          <Stat label="Reviews ingediend" value={reviewsToday} />
          <Stat label="Reviews goedgekeurd" value={reviewsApprovedToday} />
          <Stat label="Profielen geclaimd" value={profilesClaimedToday} />
        </div>
      </section>

      <section>
        <h2 className={styles.h2}>Pending tasks</h2>
        <div className={styles.statGrid}>
          <StatLink
            href="/admin/reviews"
            label="Reviews wachten op moderatie"
            value={reviewsPendingTotal}
            urgent={reviewsPendingTotal > 0}
          />
          <StatLink
            href="/admin/reviews?tab=flagged"
            label="Gemelde reviews"
            value={reviewsFlaggedTotal}
            urgent={reviewsFlaggedTotal > 0}
          />
          <Stat label="Verwijder-verzoeken (7 dagen)" value={deleteRequestsThisWeek} />
        </div>
      </section>

      <section>
        <h2 className={styles.h2}>Deze week</h2>
        <div className={styles.statGrid}>
          <Stat label="Profielweergaven" value={profileViewsWeek} />
          <Stat label="Telefoon-clicks" value={phoneClicksWeek} />
        </div>
      </section>

      <section>
        <h2 className={styles.h2}>Recente activiteit</h2>
        {recentLogs.length === 0 ? (
          <div className={styles.empty}>Nog geen log-entries.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Wanneer</th>
                <th>Event</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td>{fmtDate.format(log.createdAt)}</td>
                  <td>
                    <span className={styles.badge}>{log.eventType}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{summarize(log.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

function StatLink({
  href,
  label,
  value,
  urgent,
}: {
  href: string
  label: string
  value: number
  urgent?: boolean
}) {
  return (
    <Link href={href} className={styles.stat} style={{ textDecoration: 'none' }}>
      <div className={styles.statValue} style={{ color: urgent ? 'var(--accent)' : undefined }}>
        {new Intl.NumberFormat('nl-NL').format(value)}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </Link>
  )
}

function summarize(metadata: unknown): string {
  if (!metadata || typeof metadata !== 'object') return ''
  const m = metadata as Record<string, unknown>
  const parts: string[] = []
  if (m.email) parts.push(String(m.email))
  if (m.companyName) parts.push(String(m.companyName))
  if (m.tradespersonId) parts.push(`tp:${String(m.tradespersonId).slice(0, 8)}…`)
  if (m.userId) parts.push(`user:${String(m.userId).slice(0, 8)}…`)
  return parts.join(' · ')
}
