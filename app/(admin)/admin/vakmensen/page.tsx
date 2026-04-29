import Link from 'next/link'
import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'

import styles from '../shared.module.css'

export const metadata = { title: 'Vakmensen' }
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

type SearchParams = {
  q?: string
  city?: string
  trade?: string
  claimed?: string
  tier?: string
  pagina?: string
  sort?: string
}

export default async function VakmensenAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number.parseInt(sp.pagina ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  // ── WHERE ────────────────────────────────────────────────────────────
  const where: Prisma.TradespersonWhereInput = {}
  if (sp.q) {
    where.OR = [
      { companyName: { contains: sp.q, mode: 'insensitive' } },
      { kvkNumber: { contains: sp.q.replace(/\D/g, '') || '___' } },
      { slug: { contains: sp.q, mode: 'insensitive' } },
    ]
  }
  if (sp.city) {
    where.city = { slug: sp.city }
  }
  if (sp.trade) {
    where.trades = { some: { trade: { slug: sp.trade } } }
  }
  if (sp.claimed === 'yes') where.profileClaimed = true
  if (sp.claimed === 'no') where.profileClaimed = false
  if (sp.tier && sp.tier !== 'all') {
    where.tier = sp.tier as 'FREE' | 'PRO' | 'PREMIUM' | 'ENTERPRISE'
  }

  const sort = sp.sort ?? 'updatedAt'
  const orderBy: Prisma.TradespersonOrderByWithRelationInput =
    sort === 'companyName'
      ? { companyName: 'asc' }
      : sort === 'qualityScore'
        ? { qualityScore: 'desc' }
        : sort === 'createdAt'
          ? { createdAt: 'desc' }
          : { updatedAt: 'desc' }

  const [items, totalCount, cities, trades] = await Promise.all([
    prisma.tradesperson.findMany({
      where,
      orderBy,
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        companyName: true,
        kvkNumber: true,
        phone: true,
        city: { select: { name: true, slug: true } },
        trades: {
          select: {
            isPrimary: true,
            trade: { select: { nameSingular: true, slug: true } },
          },
          orderBy: { isPrimary: 'desc' },
          take: 1,
        },
        qualityScore: true,
        profileClaimed: true,
        tier: true,
        updatedAt: true,
      },
    }),
    prisma.tradesperson.count({ where }),
    prisma.city.findMany({
      orderBy: { name: 'asc' },
      select: { slug: true, name: true },
    }),
    prisma.trade.findMany({
      orderBy: { nameSingular: 'asc' },
      select: { slug: true, nameSingular: true },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const fmtDate = new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Admin · Vakmensen</p>
        <h1 className={styles.h1}>Vakmensen-beheer</h1>
        <p className={styles.lede}>
          {new Intl.NumberFormat('nl-NL').format(totalCount)} resultaten —{' '}
          {totalPages > 1 ? `pagina ${page} van ${totalPages}` : 'alles op één pagina'}
        </p>
      </header>

      <form className={styles.toolbar} method="get">
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ''}
          placeholder="Zoek naam, KvK, slug…"
          style={{ padding: '8px 12px', border: '1px solid var(--rule)', minWidth: 220 }}
        />
        <select
          name="city"
          defaultValue={sp.city ?? ''}
          style={{ padding: '8px 12px', border: '1px solid var(--rule)' }}
        >
          <option value="">Alle steden</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="trade"
          defaultValue={sp.trade ?? ''}
          style={{ padding: '8px 12px', border: '1px solid var(--rule)' }}
        >
          <option value="">Alle vakgebieden</option>
          {trades.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.nameSingular}
            </option>
          ))}
        </select>
        <select
          name="claimed"
          defaultValue={sp.claimed ?? ''}
          style={{ padding: '8px 12px', border: '1px solid var(--rule)' }}
        >
          <option value="">Claimed: alle</option>
          <option value="yes">Geclaimd</option>
          <option value="no">Niet geclaimd</option>
        </select>
        <select
          name="tier"
          defaultValue={sp.tier ?? ''}
          style={{ padding: '8px 12px', border: '1px solid var(--rule)' }}
        >
          <option value="">Tier: alle</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="PREMIUM">Premium</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
        <select
          name="sort"
          defaultValue={sp.sort ?? 'updatedAt'}
          style={{ padding: '8px 12px', border: '1px solid var(--rule)' }}
        >
          <option value="updatedAt">Recent gewijzigd</option>
          <option value="createdAt">Recent aangemaakt</option>
          <option value="companyName">Naam (A-Z)</option>
          <option value="qualityScore">Quality score</option>
        </select>
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
        <Link href="/admin/vakmensen" style={{ fontSize: 12, color: 'var(--muted)' }}>
          Reset
        </Link>
      </form>

      {items.length === 0 ? (
        <div className={styles.empty}>Geen vakmensen gevonden.</div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bedrijfsnaam</th>
                <th>Plaats</th>
                <th>Vakgebied</th>
                <th>KvK</th>
                <th>Score</th>
                <th>Claimed</th>
                <th>Tier</th>
                <th>Gewijzigd</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((tp) => (
                <tr key={tp.id}>
                  <td>
                    <Link href={`/admin/vakmensen/${tp.id}`}>
                      <strong>{tp.companyName}</strong>
                    </Link>
                  </td>
                  <td>{tp.city?.name ?? '—'}</td>
                  <td>{tp.trades[0]?.trade.nameSingular ?? '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{tp.kvkNumber ?? '—'}</td>
                  <td>{tp.qualityScore}</td>
                  <td>
                    {tp.profileClaimed ? (
                      <span className={`${styles.badge} ${styles.badgeOk}`}>Ja</span>
                    ) : (
                      <span className={styles.badge}>Nee</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${tp.tier !== 'FREE' ? styles.badgeAccent : ''}`}
                    >
                      {tp.tier}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                    {fmtDate.format(tp.updatedAt)}
                  </td>
                  <td>
                    <Link
                      href={`/vakman/${tp.slug}`}
                      target="_blank"
                      style={{ fontSize: 12, color: 'var(--muted)' }}
                    >
                      ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              params={sp as unknown as Record<string, string>}
            />
          )}
        </>
      )}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number
  totalPages: number
  params: Record<string, string | undefined>
}) {
  function urlFor(p: number) {
    const sp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v && k !== 'pagina') sp.set(k, v)
    })
    sp.set('pagina', String(p))
    return `/admin/vakmensen?${sp.toString()}`
  }
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
      {page > 1 && <Link href={urlFor(page - 1)}>← Vorige</Link>}
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>
        Pagina {page} / {totalPages}
      </span>
      {page < totalPages && <Link href={urlFor(page + 1)}>Volgende →</Link>}
    </div>
  )
}
