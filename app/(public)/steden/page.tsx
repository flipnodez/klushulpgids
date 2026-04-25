import type { Metadata } from 'next'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { CityGrid } from '@/components/features/city/CityGrid'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'
import { getAllCities } from '@/lib/queries'
import { provinceSlug } from '@/lib/provinces'

import styles from './page.module.css'

export const revalidate = 86400 // 24 uur — verandert vrijwel nooit

export const metadata: Metadata = {
  title: 'Alle steden — Klushulpgids',
  description: 'Bekijk alle Nederlandse gemeenten in de gids — top 100 op inwonertal.',
  alternates: { canonical: '/steden' },
}

export default async function StedenIndexPage() {
  const cities = await getAllCities()

  // Groepeer per provincie
  const byProvince = new Map<string, typeof cities>()
  for (const c of cities) {
    if (!byProvince.has(c.province)) byProvince.set(c.province, [])
    byProvince.get(c.province)!.push(c)
  }

  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Steden' }]} />
      </div>

      <header className={styles.hero}>
        <EmDashLabel>Index</EmDashLabel>
        <h1 className={styles.title}>
          Alle steden in <em className={styles.italic}>de gids</em>.
        </h1>
        <p className={styles.lede}>
          {cities.length} Nederlandse gemeenten — gegroepeerd per provincie. Klik op een stad voor
          lokale vakmensen.
        </p>
      </header>

      <Rule variant="thick" />

      {[...byProvince.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'nl'))
        .map(([province, list]) => (
          <section key={province} className={styles.provinceSection}>
            <header className={styles.provinceHead}>
              <EmDashLabel>
                <a href={`/provincie/${provinceSlug(province)}`}>{province}</a>
              </EmDashLabel>
            </header>
            <CityGrid
              items={list.map((c) => ({
                slug: c.slug,
                name: c.name,
                href: `/plaats/${c.slug}`,
              }))}
              columns={5}
            />
          </section>
        ))}
    </Container>
  )
}
