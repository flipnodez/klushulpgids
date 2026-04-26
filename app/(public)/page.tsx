import type { Metadata } from 'next'
import Link from 'next/link'

import { Container } from '@/components/ui/Container'
import { DropCap } from '@/components/ui/DropCap'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'
import { SearchInput } from '@/components/ui/SearchInput'
import { BlogCard } from '@/components/features/blog/BlogCard'
import { CategoryGrid } from '@/components/features/category/CategoryGrid'
import type { CategoryItem } from '@/components/features/category/CategoryGrid'
import { CityGrid } from '@/components/features/city/CityGrid'
import { TradespersonCard } from '@/components/features/tradesperson/TradespersonCard'
import type { IconName } from '@/components/ui/Icon'
import {
  getAllTradesWithCount,
  getRecentBlogPosts,
  getTopCities,
  getTopTradespeople,
} from '@/lib/queries'

import styles from './page.module.css'

export const revalidate = 3600 // 1 uur — homepage data verandert weinig

export const metadata: Metadata = {
  title: 'Klushulpgids — onafhankelijke gids voor Nederlandse vakmannen',
  description:
    'Vergelijk loodgieters, elektriciens, schilders, dakdekkers, hoveniers en andere vakmensen in heel Nederland. Onafhankelijk, KvK-geverifieerd, zonder tussenpersoon.',
  alternates: { canonical: '/' },
}

export default async function HomePage() {
  const [trades, cities, top, recentPosts] = await Promise.all([
    getAllTradesWithCount(),
    getTopCities(12),
    getTopTradespeople(3),
    getRecentBlogPosts(3),
  ])

  const tradeItems: CategoryItem[] = trades.map((t) => ({
    slug: t.slug,
    name: t.namePlural,
    iconName: t.iconName as IconName,
    count: t.count,
    href: `/${t.slug}`,
  }))

  const cityItems = cities.map((c) => ({
    slug: c.slug,
    name: c.name,
    province: c.province,
    href: `/plaats/${c.slug}`,
  }))

  return (
    <>
      {/* ── Hoofdartikel ─────────────────────────────────────────────────── */}
      <Container>
        <article className={styles.hero}>
          <EmDashLabel variant="accent">Hoofdartikel</EmDashLabel>
          <h1 className={styles.title}>
            Een gids, geen <em className={styles.italic}>makelaar</em>.
          </h1>
          <p className={styles.lede}>
            Klushulpgids is een onafhankelijke consumentengids voor Nederlandse ambachtslieden. Geen
            offerteformulieren, geen tussenpersoon, geen lead-fee voor de vakman — wel echte
            gegevens, certificeringen en eerlijke beoordelingen.
          </p>
          <div className={styles.searchWrap}>
            <SearchInput action="/api/search" />
          </div>
        </article>
      </Container>

      <Rule />

      {/* ── Onze belofte (3 USPs met romeinse cijfers) ─────────────────────── */}
      <Container>
        <section className={styles.belofte}>
          <EmDashLabel>Onze belofte</EmDashLabel>
          <div className={styles.beloftes}>
            <div>
              <span className={`label label-muted ${styles.romeins}`}>I</span>
              <h3 className={styles.beloftLabel}>Onafhankelijk</h3>
              <p className={styles.beloftBody}>
                Wij verdienen niets aan uw klus. De gids is geen lead-makelaar; bezoekers bellen of
                mailen rechtstreeks. Uw gegevens worden niet doorverkocht.
              </p>
            </div>
            <div>
              <span className={`label label-muted ${styles.romeins}`}>II</span>
              <h3 className={styles.beloftLabel}>KvK-geverifieerd</h3>
              <p className={styles.beloftBody}>
                Elk bedrijf in de gids is actief geregistreerd bij de Kamer van Koophandel.
                Profielen worden door de eigenaar zelf geclaimd en bijgehouden.
              </p>
            </div>
            <div>
              <span className={`label label-muted ${styles.romeins}`}>III</span>
              <h3 className={styles.beloftLabel}>Editorial, niet promotioneel</h3>
              <p className={styles.beloftBody}>
                Geen sponsored topplaatsen die de listings overschaduwen. Sortering is op kwaliteit
                en beoordeling. Plaatsing in de gids is gratis.
              </p>
            </div>
          </div>
        </section>
      </Container>

      <Rule variant="thick" />

      {/* ── Vakgebieden ────────────────────────────────────────────────────── */}
      <Container>
        <section className={styles.section}>
          <header className={styles.sectionHead}>
            <EmDashLabel>Deel I · Vakgebieden</EmDashLabel>
            <h2 className={`serif ${styles.sectionTitle}`}>
              De <em className={styles.italic}>twaalf</em> vakgebieden in de gids.
            </h2>
          </header>
          <CategoryGrid items={tradeItems} />
        </section>
      </Container>

      <Rule variant="soft" />

      {/* ── Steden ─────────────────────────────────────────────────────────── */}
      <Container>
        <section className={styles.section}>
          <header className={styles.sectionHead}>
            <EmDashLabel>Deel II · Steden</EmDashLabel>
            <h2 className={`serif ${styles.sectionTitle}`}>
              Vakmensen in heel <em className={styles.italic}>Nederland</em>.
            </h2>
            <p className={styles.sectionSub}>
              De grootste twaalf gemeenten — ga voor uw stad naar de overzichts­pagina.
            </p>
          </header>
          <CityGrid items={cityItems} showProvince />
          <Link href="/steden" className={styles.allLink}>
            Alle steden bekijken →
          </Link>
        </section>
      </Container>

      {/* ── Drie vakmensen uit de gids ──────────────────────────────────────── */}
      {top.length > 0 && (
        <>
          <Rule variant="thick" />
          <Container>
            <section className={styles.section}>
              <header className={styles.sectionHead}>
                <EmDashLabel variant="accent">Drie uit de gids</EmDashLabel>
                <h2 className={`serif ${styles.sectionTitle}`}>
                  Hooggewaardeerde vakmensen, willekeurig uit de gids genomen.
                </h2>
              </header>
              <div className={styles.featuredGrid}>
                {top.map((tp) => {
                  const trade = tp.trades[0]?.trade
                  return (
                    <TradespersonCard
                      key={tp.id}
                      data={{
                        slug: tp.slug,
                        companyName: tp.companyName,
                        cityName: tp.city?.name,
                        tradeName: trade?.nameSingular,
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

      {/* ── Editorial: Hoe wij werken ──────────────────────────────────────── */}
      <Rule variant="thick" />
      <Container>
        <section className={styles.editorial}>
          <EmDashLabel variant="muted">Hoe wij werken</EmDashLabel>
          <h2 className={`serif ${styles.editorialTitle}`}>
            Wij verzamelen, controleren, en publiceren — meer <em>niet</em>.
          </h2>
          <DropCap className={styles.editorialBody}>
            De gids put uit publieke bronnen: Kamer van Koophandel, branche­verenigingen (Techniek
            Nederland, Bouwend Nederland, Groenkeur), en eventuele eigen beoordelingen. We voegen
            geen verzonnen reviews toe en kopen geen rankings. Vakmensen kunnen hun profiel zelf
            claimen en bijwerken — daarna staan zij zelf aan het roer over wat wel en niet getoond
            wordt.
          </DropCap>
          <Link href="/over-ons" className={styles.allLink}>
            Lees meer over onze werkwijze →
          </Link>
        </section>
      </Container>

      {/* ── Recente blog-posts ─────────────────────────────────────────────── */}
      {recentPosts.length > 0 && (
        <>
          <Rule variant="soft" />
          <Container>
            <section className={styles.section}>
              <header className={styles.sectionHead}>
                <EmDashLabel>Uit de redactie</EmDashLabel>
                <h2 className={`serif ${styles.sectionTitle}`}>Recente artikelen.</h2>
              </header>
              <div className={styles.blogGrid}>
                {recentPosts.map((post) => (
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
              <Link href="/blog" className={styles.allLink}>
                Alle artikelen →
              </Link>
            </section>
          </Container>
        </>
      )}

      {/* ── Trust colofon ──────────────────────────────────────────────────── */}
      <Rule variant="thick" />
      <Container>
        <section className={styles.trust}>
          <EmDashLabel variant="muted">Volgens redactie</EmDashLabel>
          <p className={styles.trustBody}>
            Klushulpgids is een redactie­product van een onafhankelijk team. Wij volgen
            consumenten­bondige principes: feitelijk, controleerbaar, en zonder commerciële
            beïnvloeding van de listings. Profielen zijn KvK-geverifieerd en kunnen door de eigenaar
            worden geclaimd.
          </p>
        </section>
      </Container>
    </>
  )
}
