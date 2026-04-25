import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { CategoryGrid } from '@/components/features/category/CategoryGrid'
import type { CategoryItem } from '@/components/features/category/CategoryGrid'
import { CityGrid } from '@/components/features/city/CityGrid'
import { TradespersonCard } from '@/components/features/tradesperson/TradespersonCard'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'
import type { IconName } from '@/components/ui/Icon'
import {
  countTradespeopleByCity,
  getCityBySlug,
  getNearbyCities,
  getTradesInCity,
} from '@/lib/queries'
import { prisma } from '@/lib/db'
import { provinceSlug } from '@/lib/provinces'

import styles from './page.module.css'

export const revalidate = 21600 // 6 uur

type Params = { stad: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { stad } = await params
  const city = await getCityBySlug(stad)
  if (!city) return {}
  return {
    title: `Vakmensen in ${city.name}`,
    description: `Onafhankelijk overzicht van vakmensen in ${city.name}, ${city.province}. Loodgieters, elektriciens, schilders, hoveniers en meer — met certificeringen en beoordelingen.`,
    alternates: { canonical: `/plaats/${city.slug}` },
  }
}

export default async function StadPage({ params }: { params: Promise<Params> }) {
  const { stad } = await params
  const city = await getCityBySlug(stad)
  if (!city) notFound()

  const [trades, totalCount, topInCity, nearby] = await Promise.all([
    getTradesInCity(stad),
    countTradespeopleByCity(stad),
    // Top 4 met rating > 4.5 over alle vakgebieden
    prisma.tradesperson.findMany({
      where: {
        city: { slug: stad },
        ratingAvg: { gte: 4.5 },
      },
      select: {
        id: true,
        slug: true,
        companyName: true,
        foundedYear: true,
        ratingAvg: true,
        ratingCount: true,
        googleRating: true,
        googleReviewsCount: true,
        specialties: true,
        availabilityStatus: true,
        availabilityUpdatedAt: true,
        phone: true,
        tier: true,
        city: { select: { name: true } },
        trades: {
          take: 1,
          select: { trade: { select: { nameSingular: true } } },
        },
      },
      orderBy: [{ ratingAvg: 'desc' }, { qualityScore: 'desc' }],
      take: 4,
    }),
    getNearbyCities(city, 6),
  ])

  const tradeItems: CategoryItem[] = trades.map((t) => ({
    slug: t.slug,
    name: t.namePlural,
    iconName: t.iconName as IconName,
    count: t.count,
    href: `/${t.slug}/${city.slug}`,
  }))

  return (
    <>
      <Container>
        <div className={styles.crumbWrap}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Steden', href: '/steden' },
              { label: city.name },
            ]}
          />
        </div>

        <header className={styles.hero}>
          <EmDashLabel>Stadspagina</EmDashLabel>
          <h1 className={styles.title}>
            Vakmensen in <em className={styles.italic}>{city.name}</em>.
          </h1>
          <p className={styles.lede}>
            {new Intl.NumberFormat('nl-NL').format(totalCount)} vakmensen actief in {city.name},{' '}
            {city.province}. Kies een vakgebied of bekijk de hooggewaardeerde vakmensen hieronder.
          </p>
        </header>
      </Container>

      <Rule variant="thick" />

      <Container>
        <section className={styles.section}>
          <header className={styles.sectionHead}>
            <EmDashLabel>Vakgebieden in {city.name}</EmDashLabel>
            <p className={styles.sectionSub}>
              Klik op een vakgebied voor lokale vakmensen met beoordelingen.
            </p>
          </header>
          <CategoryGrid items={tradeItems} />
        </section>
      </Container>

      {topInCity.length > 0 && (
        <>
          <Rule variant="soft" />
          <Container>
            <section className={styles.section}>
              <header className={styles.sectionHead}>
                <EmDashLabel variant="accent">Hoog beoordeeld</EmDashLabel>
                <h2 className={`serif ${styles.h2}`}>
                  De best beoordeelde vakmensen in <em className={styles.italic}>{city.name}</em>.
                </h2>
              </header>
              <div className={styles.tpGrid}>
                {topInCity.map((tp) => {
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

      {nearby.length > 0 && (
        <>
          <Rule variant="thick" />
          <Container>
            <section className={styles.section}>
              <EmDashLabel>Nabijgelegen steden</EmDashLabel>
              <CityGrid
                showProvince
                items={nearby.map((n) => ({
                  slug: n.slug,
                  name: n.name,
                  province: `${n.province} · ${n.distanceKm} km`,
                  href: `/plaats/${n.slug}`,
                }))}
              />
              <Link href={`/provincie/${provinceSlug(city.province)}`} className={styles.allLink}>
                Alle steden in {city.province} →
              </Link>
            </section>
          </Container>
        </>
      )}
    </>
  )
}
