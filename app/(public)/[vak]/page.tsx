import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { BlogCard } from '@/components/features/blog/BlogCard'
import { TradespersonCard } from '@/components/features/tradesperson/TradespersonCard'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'
import {
  countTradespeopleByVak,
  getBlogPostsByTrade,
  getCitiesWithTradeCount,
  getTopTradespeopleByTrade,
  getTradeBySlug,
} from '@/lib/queries'

import styles from './page.module.css'

export const revalidate = 21600 // 6 uur

type Params = { vak: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { vak } = await params
  const trade = await getTradeBySlug(vak)
  if (!trade) return {}

  return {
    title: `${trade.namePlural} in Nederland`,
    description: trade.seoDescriptionTemplate.replace('{city}', 'Nederland'),
    alternates: { canonical: `/${trade.slug}` },
  }
}

export default async function VakPage({ params }: { params: Promise<Params> }) {
  const { vak } = await params
  const trade = await getTradeBySlug(vak)
  if (!trade) notFound()

  const [totalCount, citiesWithCount, topTradespeople, blogPosts] = await Promise.all([
    countTradespeopleByVak(vak),
    getCitiesWithTradeCount(vak, 30),
    getTopTradespeopleByTrade(trade.id, 6),
    getBlogPostsByTrade(trade.id, 3),
  ])

  return (
    <>
      <Container>
        <div className={styles.crumbWrap}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Vakgebieden', href: '/vakgebieden' },
              { label: trade.namePlural },
            ]}
          />
        </div>

        <header className={styles.hero}>
          <EmDashLabel>Categorie</EmDashLabel>
          <h1 className={styles.title}>
            {trade.namePlural} in <em className={styles.italic}>Nederland</em>.
          </h1>
          <p className={styles.lede}>{trade.description}</p>
          <div className={styles.stats}>
            <span className="label label-muted">In de gids</span>
            <span className={styles.statNumber}>
              {new Intl.NumberFormat('nl-NL').format(totalCount)} {trade.namePlural.toLowerCase()}
            </span>
          </div>
        </header>
      </Container>

      <Rule variant="thick" />

      {/* ── Steden-lijst ─────────────────────────────────────────────────── */}
      <Container>
        <section className={styles.section}>
          <header className={styles.sectionHead}>
            <EmDashLabel>{trade.namePlural} per stad</EmDashLabel>
            <p className={styles.sectionSub}>
              Kies uw stad voor lokale {trade.namePlural.toLowerCase()} met beoordelingen,
              certificeringen en directe contactgegevens.
            </p>
          </header>
          {citiesWithCount.length === 0 ? (
            <p className="muted">Geen steden gevonden voor dit vakgebied.</p>
          ) : (
            <ul className={styles.cityList}>
              {citiesWithCount.map((c) => (
                <li key={c.id}>
                  <Link href={`/${trade.slug}/${c.slug}`} className={styles.cityLink}>
                    <span className={`serif ${styles.cityName}`}>
                      {trade.namePlural} in {c.name}
                    </span>
                    <span className={`muted text-sm ${styles.cityCount}`}>
                      ({new Intl.NumberFormat('nl-NL').format(c.count)})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/steden" className={styles.allLink}>
            Alle steden bekijken →
          </Link>
        </section>
      </Container>

      {/* ── Top vakmensen in categorie ───────────────────────────────────── */}
      {topTradespeople.length > 0 && (
        <>
          <Rule variant="soft" />
          <Container>
            <section className={styles.section}>
              <header className={styles.sectionHead}>
                <EmDashLabel variant="accent">Hoog beoordeeld</EmDashLabel>
                <h2 className={`serif ${styles.h2}`}>
                  {trade.namePlural} <em className={styles.italic}>met hoge waardering</em>.
                </h2>
              </header>
              <div className={styles.tpGrid}>
                {topTradespeople.map((tp) => {
                  const tpTrade = tp.trades[0]?.trade
                  return (
                    <TradespersonCard
                      key={tp.id}
                      data={{
                        slug: tp.slug,
                        companyName: tp.companyName,
                        cityName: tp.city?.name,
                        tradeName: tpTrade?.nameSingular,
                        foundedYear: tp.foundedYear,
                        ratingAvg: tp.ratingAvg,
                        ratingCount: tp.ratingCount,
                        googleRating: tp.googleRating,
                        googleReviewsCount: tp.googleReviewsCount,
                        specialties: tp.specialties,
                        availabilityStatus: tp.availabilityStatus,
                        availabilityUpdatedAt: tp.availabilityUpdatedAt?.toISOString(),
                        phone: tp.phone,
                        tier: tp.tier,
                      }}
                      href={`/vakman/${tp.slug}`}
                    />
                  )
                })}
              </div>
            </section>
          </Container>
        </>
      )}

      {/* ── Gerelateerde blog-posts ──────────────────────────────────────── */}
      {blogPosts.length > 0 && (
        <>
          <Rule variant="soft" />
          <Container>
            <section className={styles.section}>
              <EmDashLabel>Uit de redactie</EmDashLabel>
              <div className={styles.blogGrid}>
                {blogPosts.map((post) => (
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
            </section>
          </Container>
        </>
      )}
    </>
  )
}
