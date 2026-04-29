import { notFound } from 'next/navigation'
import Link from 'next/link'

import { prisma } from '@/lib/db'

import { BlogEditor } from '../BlogEditor'
import styles from '../../shared.module.css'

export const metadata = { title: 'Post bewerken' }
export const dynamic = 'force-dynamic'

type Params = { id: string }

export default async function BlogEditPage({ params }: { params: Promise<Params> }) {
  const { id } = await params

  const [post, trades, cities] = await Promise.all([
    prisma.blogPost.findUnique({ where: { id } }),
    prisma.trade.findMany({
      orderBy: { nameSingular: 'asc' },
      select: { id: true, nameSingular: true },
    }),
    prisma.city.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  if (!post) notFound()

  const faqItems = Array.isArray(post.faqItems)
    ? (post.faqItems as { question: string; answer: string }[])
    : []
  const howToSteps = Array.isArray(post.howToSteps)
    ? (post.howToSteps as { name: string; text: string }[])
    : []

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>
          <Link href="/admin/blog">← Blog overzicht</Link>
        </p>
        <h1 className={styles.h1}>{post.title}</h1>
        <p className={styles.lede}>
          {post.publishedAt ? (
            <>
              Gepubliceerd{' '}
              <Link href={`/blog/${post.slug}`} target="_blank">
                /blog/{post.slug} ↗
              </Link>
            </>
          ) : (
            <>
              Concept · /blog/<strong>{post.slug}</strong>
            </>
          )}
        </p>
      </header>

      <BlogEditor
        initial={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          metaDescription: post.metaDescription,
          excerpt: post.excerpt,
          body: post.body,
          coverImageUrl: post.coverImageUrl,
          coverImageAlt: post.coverImageAlt,
          authorName: post.authorName,
          category: post.category,
          relatedTradeId: post.relatedTradeId,
          relatedCityId: post.relatedCityId,
          faqItems,
          howToSteps,
          publishedAt: post.publishedAt?.toISOString() ?? null,
        }}
        trades={trades}
        cities={cities}
      />
    </div>
  )
}
