import type { Metadata } from 'next'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { CategoryGrid } from '@/components/features/category/CategoryGrid'
import type { CategoryItem } from '@/components/features/category/CategoryGrid'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'
import type { IconName } from '@/components/ui/Icon'
import { getAllTradesWithCount } from '@/lib/queries'

import styles from './page.module.css'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Alle vakgebieden — Klushulpgids',
  description: 'De twaalf vakgebieden in de gids — kies uw vakgebied voor lokale vakmensen.',
  alternates: { canonical: '/vakgebieden' },
}

export default async function VakgebiedenIndexPage() {
  const trades = await getAllTradesWithCount()
  const items: CategoryItem[] = trades.map((t) => ({
    slug: t.slug,
    name: t.namePlural,
    iconName: t.iconName as IconName,
    count: t.count,
    href: `/${t.slug}`,
  }))

  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Vakgebieden' }]} />
      </div>

      <header className={styles.hero}>
        <EmDashLabel>Index</EmDashLabel>
        <h1 className={styles.title}>
          De <em className={styles.italic}>twaalf</em> vakgebieden.
        </h1>
        <p className={styles.lede}>
          Klik op een vakgebied voor het landelijk overzicht en doorklik per stad.
        </p>
      </header>

      <Rule variant="thick" />

      <section className={styles.section}>
        <CategoryGrid items={items} />
      </section>
    </Container>
  )
}
