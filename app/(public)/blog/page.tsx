import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { BlogCard } from '@/components/features/blog/BlogCard'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'
import { countBlogPosts, getBlogPosts } from '@/lib/queries'

import styles from './page.module.css'

export const revalidate = 1800

const PAGE_SIZE = 12

const CATEGORY_LABELS: Record<string, string> = {
  KOSTEN: 'Kosten',
  TIPS: 'Tips',
  VERDUURZAMEN: 'Verduurzamen',
  REGELGEVING: 'Regelgeving',
  VERHALEN: 'Verhalen',
  VAKMANNEN: 'Vakmannen',
  HOE_DOE_JE: 'Hoe doet u dat?',
}

type SearchParams = { pagina?: string; categorie?: string }

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const sp = await searchParams
  const cat = sp.categorie ? CATEGORY_LABELS[sp.categorie] : null
  return {
    title: cat ? `Blog · ${cat}` : 'Blog',
    description:
      'Editorial artikelen over vakmensen, kosten, regelgeving, verduurzamen en hoe-doet-u-dat-vragen voor de Nederlandse woningbezitter.',
    alternates: { canonical: cat ? `/blog?categorie=${sp.categorie}` : '/blog' },
  }
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number.parseInt(sp.pagina ?? '1', 10) || 1)
  const category = sp.categorie

  const [posts, total] = await Promise.all([
    getBlogPosts({ take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, category }),
    countBlogPosts({ category }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />
      </div>

      <header className={styles.hero}>
        <EmDashLabel>Blog</EmDashLabel>
        <h1 className={styles.title}>
          Uit de <em className={styles.italic}>redactie</em>.
        </h1>
        <p className={styles.lede}>
          Editorial artikelen over vakmensen, kosten, regelgeving en duurzaamheid voor de
          Nederlandse woningbezitter.
        </p>
      </header>

      <Rule variant="thick" />

      {/* Categorie-filter */}
      <nav className={styles.catNav} aria-label="Filter op categorie">
        <Link
          href="/blog"
          className={!category ? styles.catActive : styles.catLink}
          aria-current={!category ? 'page' : undefined}
        >
          Alle
        </Link>
        {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
          <Link
            key={slug}
            href={`/blog?categorie=${slug}`}
            className={category === slug ? styles.catActive : styles.catLink}
            aria-current={category === slug ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>

      <Rule variant="soft" />

      {posts.length === 0 ? (
        <p className={`muted ${styles.empty}`}>
          Nog geen artikelen{category ? ` in deze categorie` : ''} gepubliceerd.
        </p>
      ) : (
        <div className={styles.grid}>
          {posts.map((post) => (
            <BlogCard
              key={post.id}
              href={`/blog/${post.slug}`}
              data={{
                slug: post.slug,
                title: post.title,
                excerpt: post.excerpt,
                coverImageUrl: post.coverImageUrl,
                coverImageAlt: post.coverImageAlt,
                category: post.category,
                authorName: post.authorName,
                publishedAt: post.publishedAt?.toISOString(),
              }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Paginering">
          {page > 1 && (
            <Link
              href={{
                pathname: '/blog',
                query: { ...sp, pagina: page - 1 },
              }}
              className={styles.pageLink}
            >
              ← Vorige
            </Link>
          )}
          <span className={styles.pageMeta}>
            Pagina {page} van {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={{
                pathname: '/blog',
                query: { ...sp, pagina: page + 1 },
              }}
              className={styles.pageLink}
            >
              Volgende →
            </Link>
          )}
        </nav>
      )}
    </Container>
  )
}
