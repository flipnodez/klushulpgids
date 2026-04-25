import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { BlogCard } from '@/components/features/blog/BlogCard'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Label } from '@/components/ui/Label'
import { Rule } from '@/components/ui/Rule'
import { getBlogPostBySlug, getRelatedPosts } from '@/lib/queries'

import styles from './page.module.css'

export const revalidate = 1800

const CATEGORY_LABELS: Record<string, string> = {
  KOSTEN: 'Kosten',
  TIPS: 'Tips',
  VERDUURZAMEN: 'Verduurzamen',
  REGELGEVING: 'Regelgeving',
  VERHALEN: 'Verhalen',
  VAKMANNEN: 'Vakmannen',
  HOE_DOE_JE: 'Hoe doet u dat?',
}

type Params = { slug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post || !post.publishedAt) return {}

  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.metaDescription,
      ...(post.coverImageUrl && {
        images: [{ url: post.coverImageUrl, alt: post.coverImageAlt ?? post.title }],
      }),
      publishedTime: post.publishedAt.toISOString(),
      authors: [post.authorName],
    },
  }
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

function readingMinutes(body: string): number {
  const words = body.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 220))
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post || !post.publishedAt) notFound()

  const related = await getRelatedPosts(post, 3)
  const minutes = readingMinutes(post.body)

  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.title },
          ]}
        />
      </div>

      <article className={styles.article}>
        <header className={styles.head}>
          <Label variant="accent" className={styles.category}>
            {CATEGORY_LABELS[post.category] ?? post.category}
          </Label>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={`muted text-sm ${styles.meta}`}>
            {formatDate(post.publishedAt)} · {minutes} min lezen · {post.authorName}
          </div>
        </header>

        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? post.title}
            className={styles.cover}
            loading="eager"
          />
        )}

        <div className={styles.body}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
        </div>

        {(post.relatedTrade || post.relatedCity) && (
          <footer className={styles.relatedTags}>
            <span className="label label-muted">Gerelateerd</span>
            {post.relatedTrade && (
              <Link href={`/${post.relatedTrade.slug}`} className={styles.tag}>
                {post.relatedTrade.namePlural}
              </Link>
            )}
            {post.relatedCity && (
              <Link href={`/plaats/${post.relatedCity.slug}`} className={styles.tag}>
                {post.relatedCity.name}
              </Link>
            )}
          </footer>
        )}
      </article>

      {related.length > 0 && (
        <>
          <Rule variant="thick" />
          <section className={styles.relatedSection}>
            <EmDashLabel>Verder lezen</EmDashLabel>
            <div className={styles.relatedGrid}>
              {related.map((p) => (
                <BlogCard
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  layout="compact"
                  data={{
                    slug: p.slug,
                    title: p.title,
                    excerpt: p.excerpt,
                    coverImageUrl: p.coverImageUrl,
                    coverImageAlt: p.coverImageAlt,
                    category: p.category,
                    authorName: p.authorName,
                    publishedAt: p.publishedAt?.toISOString(),
                  }}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </Container>
  )
}
