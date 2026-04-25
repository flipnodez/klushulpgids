import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { CategoryGrid } from '@/components/features/category/CategoryGrid'
import type { CategoryItem } from '@/components/features/category/CategoryGrid'
import { CityGrid } from '@/components/features/city/CityGrid'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'
import type { IconName } from '@/components/ui/Icon'
import { getAllTradesWithCount, getCitiesByProvince } from '@/lib/queries'
import { provinceFromSlug } from '@/lib/provinces'

import styles from './page.module.css'

export const revalidate = 21600

type Params = { slug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const province = provinceFromSlug(slug)
  if (!province) return {}
  return {
    title: `Vakmensen in ${province}`,
    description: `Onafhankelijk overzicht van vakmensen in ${province}. Steden, vakgebieden en directe contactgegevens.`,
    alternates: { canonical: `/provincie/${slug}` },
  }
}

export default async function ProvincePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const province = provinceFromSlug(slug)
  if (!province) notFound()

  const [cities, trades] = await Promise.all([
    getCitiesByProvince(province),
    getAllTradesWithCount(),
  ])

  const tradeItems: CategoryItem[] = trades.map((t) => ({
    slug: t.slug,
    name: t.namePlural,
    iconName: t.iconName as IconName,
    count: t.count,
    href: `/${t.slug}`,
  }))

  return (
    <>
      <Container>
        <div className={styles.crumbWrap}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Provincies', href: '/provincies' },
              { label: province },
            ]}
          />
        </div>

        <header className={styles.hero}>
          <EmDashLabel>Provincie</EmDashLabel>
          <h1 className={styles.title}>
            Vakmensen in <em className={styles.italic}>{province}</em>.
          </h1>
          <p className={styles.lede}>
            {cities.length} gemeenten in {province}, met vakmensen voor uiteenlopende klussen — van
            loodgieter tot hovenier.
          </p>
        </header>
      </Container>

      <Rule variant="thick" />

      <Container>
        <section className={styles.section}>
          <EmDashLabel>Steden in {province}</EmDashLabel>
          {cities.length === 0 ? (
            <p className="muted">Geen steden gevonden in deze provincie.</p>
          ) : (
            <CityGrid
              items={cities.map((c) => ({
                slug: c.slug,
                name: c.name,
                href: `/plaats/${c.slug}`,
              }))}
              columns={5}
            />
          )}
        </section>
      </Container>

      <Rule variant="soft" />

      <Container>
        <section className={styles.section}>
          <EmDashLabel>Vakgebieden</EmDashLabel>
          <CategoryGrid items={tradeItems} />
        </section>
      </Container>
    </>
  )
}
