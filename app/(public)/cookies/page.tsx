import type { Metadata } from 'next'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'

import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: 'Cookies',
  description:
    'Klushulpgids gebruikt geen tracking-cookies. Alleen functionele cookies en cookieless analytics via Plausible.',
  alternates: { canonical: '/cookies' },
}

export default function CookiesPage() {
  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Cookies' }]} />
      </div>

      <article className={styles.article}>
        <header className={styles.head}>
          <EmDashLabel>Juridisch</EmDashLabel>
          <h1 className={styles.title}>Cookies</h1>
          <p className="muted text-sm">Laatst gewijzigd: 25 april 2026</p>
        </header>

        <Rule variant="thick" />

        <section className={styles.section}>
          <h2>Korte versie</h2>
          <p>
            Klushulpgids gebruikt <strong>geen tracking-cookies</strong> en{' '}
            <strong>geen advertentie-cookies</strong>. Wij hebben dus geen cookie-banner nodig.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Welke cookies dan wel?</h2>
          <ul>
            <li>
              <strong>Functionele cookies</strong> — alleen wanneer u inlogt als vakman (vanaf fase
              6) of een review indient. Deze bewaren uw sessie en zijn nodig voor de werking van de
              site.
            </li>
            <li>
              <strong>Voorkeur-cookies</strong> — bijvoorbeeld uw donker/licht-thema keuze. Bewaard
              in localStorage, niet doorgegeven aan derden.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Bezoekers­statistieken</h2>
          <p>
            Wij gebruiken <strong>Plausible</strong> — een privacy-vriendelijk analytics-platform
            dat <em>cookieless</em> werkt. Geen IP-adressen, geen apparaat-fingerprints, geen
            tracking-cookies, geen <em>cross-site</em> tracking. Plausible-data is geaggregeerd en
            niet te herleiden tot individuele bezoekers.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Externe inhoud</h2>
          <p>
            Wij betten geen externe scripts in zoals YouTube-video&apos;s, Facebook pixels of Google
            fonts. Lettertypen worden zelf gehost. Externe review-platforms zoals Klantenvertellen
            worden alleen geopend als u actief op een link klikt.
          </p>
        </section>
      </article>
    </Container>
  )
}
