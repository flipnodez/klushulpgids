import Link from 'next/link'
import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'

import styles from '../shared.module.css'

export const metadata = { title: 'Compliance log' }
export const dynamic = 'force-dynamic'

type SearchParams = {
  event?: string
  q?: string
  from?: string
  to?: string
  pagina?: string
}

const PAGE_SIZE = 100

export default async function ComplianceLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number.parseInt(sp.pagina ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const where: Prisma.ComplianceLogWhereInput = {}
  if (sp.event) where.eventType = sp.event
  if (sp.from || sp.to) {
    where.createdAt = {}
    if (sp.from) where.createdAt.gte = new Date(sp.from)
    if (sp.to) {
      const toDate = new Date(sp.to)
      toDate.setHours(23, 59, 59, 999)
      where.createdAt.lte = toDate
    }
  }

  const [items, totalCount, eventTypes] = await Promise.all([
    prisma.complianceLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      select: { id: true, eventType: true, createdAt: true, metadata: true },
    }),
    prisma.complianceLog.count({ where }),
    prisma.complianceLog.findMany({
      distinct: ['eventType'],
      select: { eventType: true },
      orderBy: { eventType: 'asc' },
    }),
  ])

  // Filter by 'q' in metadata after fetch (Prisma JSON contains is awkward)
  const filtered = sp.q
    ? items.filter((i) => JSON.stringify(i.metadata).toLowerCase().includes(sp.q!.toLowerCase()))
    : items

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const fmtDate = new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  // Build CSV-export URL
  const csvParams = new URLSearchParams()
  if (sp.event) csvParams.set('event', sp.event)
  if (sp.from) csvParams.set('from', sp.from)
  if (sp.to) csvParams.set('to', sp.to)

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Admin · Compliance</p>
        <h1 className={styles.h1}>Compliance log</h1>
        <p className={styles.lede}>
          {new Intl.NumberFormat('nl-NL').format(totalCount)} entries — read-only audit trail.
        </p>
      </header>

      <form className={styles.toolbar} method="get">
        <select
          name="event"
          defaultValue={sp.event ?? ''}
          style={{ padding: '8px 12px', border: '1px solid var(--rule)' }}
        >
          <option value="">Alle events</option>
          {eventTypes.map((e) => (
            <option key={e.eventType} value={e.eventType}>
              {e.eventType}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={sp.from ?? ''}
          style={{ padding: '8px 12px', border: '1px solid var(--rule)' }}
        />
        <input
          type="date"
          name="to"
          defaultValue={sp.to ?? ''}
          style={{ padding: '8px 12px', border: '1px solid var(--rule)' }}
        />
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ''}
          placeholder="Zoek in metadata…"
          style={{ padding: '8px 12px', border: '1px solid var(--rule)', minWidth: 200 }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            border: '1px solid var(--ink)',
            background: 'var(--ink)',
            color: '#fff',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          Filter
        </button>
        <Link href="/admin/compliance" style={{ fontSize: 12, color: 'var(--muted)' }}>
          Reset
        </Link>
        <span className={styles.toolbarSpacer} />
        <Link
          href={`/api/admin/compliance/export?${csvParams.toString()}`}
          style={{
            padding: '8px 16px',
            border: '1px solid var(--rule)',
            background: '#fff',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: 'var(--ink)',
            textDecoration: 'none',
          }}
        >
          ↓ Export CSV
        </Link>
      </form>

      {filtered.length === 0 ? (
        <div className={styles.empty}>Geen log-entries gevonden.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Wanneer</th>
              <th>Event</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id}>
                <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                  {fmtDate.format(l.createdAt)}
                </td>
                <td>
                  <span className={styles.badge}>{l.eventType}</span>
                </td>
                <td>
                  <code
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      display: 'block',
                      maxWidth: 600,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {JSON.stringify(l.metadata, null, 0)}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          {page > 1 && <Link href={`/admin/compliance?pagina=${page - 1}`}>← Vorige</Link>}
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            Pagina {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/compliance?pagina=${page + 1}`}>Volgende →</Link>
          )}
        </div>
      )}
    </div>
  )
}
