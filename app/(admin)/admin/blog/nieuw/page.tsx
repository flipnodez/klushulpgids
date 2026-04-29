import Link from 'next/link'

import { prisma } from '@/lib/db'

import { BlogEditor } from '../BlogEditor'
import styles from '../../shared.module.css'

export const metadata = { title: 'Nieuwe post' }
export const dynamic = 'force-dynamic'

export default async function NewBlogPostPage() {
  const [trades, cities] = await Promise.all([
    prisma.trade.findMany({
      orderBy: { nameSingular: 'asc' },
      select: { id: true, nameSingular: true },
    }),
    prisma.city.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>
          <Link href="/admin/blog">← Blog overzicht</Link>
        </p>
        <h1 className={styles.h1}>Nieuwe blog-post</h1>
        <p className={styles.lede}>
          Concept opslaan kan zonder publish-datum. Klik op &ldquo;Publiceren&rdquo; om het op de
          site te zetten (na opslaan).
        </p>
      </header>

      <BlogEditor
        initial={{
          id: null,
          slug: '',
          title: '',
          metaDescription: '',
          excerpt: '',
          body: '',
          coverImageUrl: null,
          coverImageAlt: null,
          authorName: 'Klushulpgids Redactie',
          category: 'TIPS',
          relatedTradeId: null,
          relatedCityId: null,
          faqItems: [],
          howToSteps: [],
          publishedAt: null,
        }}
        trades={trades}
        cities={cities}
      />
    </div>
  )
}
