import Link from 'next/link'
import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'

import styles from '../shared.module.css'

export const metadata = { title: 'Blog' }
export const dynamic = 'force-dynamic'

type SearchParams = { q?: string; category?: string; status?: string }

export default async function BlogAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams

  const where: Prisma.BlogPostWhereInput = {}
  if (sp.q) {
    where.OR = [
      { title: { contains: sp.q, mode: 'insensitive' } },
      { slug: { contains: sp.q, mode: 'insensitive' } },
    ]
  }
  if (sp.category) {
    where.category = sp.category as Prisma.BlogPostWhereInput['category']
  }
  if (sp.status === 'published') where.publishedAt = { not: null, lte: new Date() }
  if (sp.status === 'draft') where.publishedAt = null

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      authorName: true,
      publishedAt: true,
      updatedAt: true,
    },
  })

  const fmtDate = new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Admin · Blog</p>
        <h1 className={styles.h1}>Blog CMS</h1>
        <p className={styles.lede}>{posts.length} blog-posts in totaal.</p>
      </header>

      <div
        style={{
          display: 'flex',
          gap: 'var(--sp-3)',
          alignItems: 'center',
          marginBottom: 'var(--sp-4)',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/admin/blog/nieuw"
          style={{
            background: 'var(--ink)',
            color: '#fff',
            padding: '10px 18px',
            textDecoration: 'none',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 600,
          }}
        >
          + Nieuwe post
        </Link>
        <form className={styles.toolbar} method="get" style={{ flex: 1, margin: 0 }}>
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Zoek titel of slug…"
            style={{ padding: '8px 12px', border: '1px solid var(--rule)', minWidth: 200 }}
          />
          <select
            name="category"
            defaultValue={sp.category ?? ''}
            style={{ padding: '8px 12px', border: '1px solid var(--rule)' }}
          >
            <option value="">Alle categorieën</option>
            <option value="KOSTEN">Kosten</option>
            <option value="TIPS">Tips</option>
            <option value="VERDUURZAMEN">Verduurzamen</option>
            <option value="REGELGEVING">Regelgeving</option>
            <option value="VERHALEN">Verhalen</option>
            <option value="VAKMANNEN">Vakmannen</option>
            <option value="HOE_DOE_JE">Hoe doe je dat?</option>
          </select>
          <select
            name="status"
            defaultValue={sp.status ?? ''}
            style={{ padding: '8px 12px', border: '1px solid var(--rule)' }}
          >
            <option value="">Alle statussen</option>
            <option value="published">Gepubliceerd</option>
            <option value="draft">Concept</option>
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
        </form>
      </div>

      {posts.length === 0 ? (
        <div className={styles.empty}>Geen posts gevonden.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Titel</th>
              <th>Categorie</th>
              <th>Auteur</th>
              <th>Status</th>
              <th>Publish</th>
              <th>Gewijzigd</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/blog/${p.id}`}>
                    <strong>{p.title}</strong>
                  </Link>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>/blog/{p.slug}</div>
                </td>
                <td>
                  <span className={styles.badge}>{p.category}</span>
                </td>
                <td style={{ fontSize: 13 }}>{p.authorName}</td>
                <td>
                  {p.publishedAt ? (
                    <span className={`${styles.badge} ${styles.badgeOk}`}>Gepubliceerd</span>
                  ) : (
                    <span className={`${styles.badge} ${styles.badgeWarn}`}>Concept</span>
                  )}
                </td>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  {p.publishedAt ? fmtDate.format(p.publishedAt) : '—'}
                </td>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  {fmtDate.format(p.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
