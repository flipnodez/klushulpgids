import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'
import { PROVINCES, provinceSlug } from '@/lib/provinces'

import styles from './page.module.css'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Provincies — Klushulpgids',
  description: 'De twaalf Nederlandse provincies — kies uw provincie voor steden en vakmensen.',
  alternates: { canonical: '/provincies' },
}

export default function ProvinciesPage() {
  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Provincies' }]} />
      </div>

      <header className={styles.hero}>
        <EmDashLabel>Index</EmDashLabel>
        <h1 className={styles.title}>
          De twaalf <em className={styles.italic}>provincies</em>.
        </h1>
        <p className={styles.lede}>
          Bekijk de gids per provincie — klik door naar steden en vakgebieden.
        </p>
      </header>

      <Rule variant="thick" />

      <ul className={styles.list}>
        {[...PROVINCES]
          .sort((a, b) => a.localeCompare(b, 'nl'))
          .map((p) => (
            <li key={p}>
              <Link href={`/provincie/${provinceSlug(p)}`} className={styles.row}>
                <span className={`serif ${styles.name}`}>{p}</span>
                <span className="muted text-sm">→</span>
              </Link>
            </li>
          ))}
      </ul>
    </Container>
  )
}
