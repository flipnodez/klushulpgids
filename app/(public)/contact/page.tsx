import type { Metadata } from 'next'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactgegevens van de Klushulpgids-redactie.',
  alternates: { canonical: '/contact' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact — Klushulpgids',
  url: 'https://klushulpgids.nl/contact',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      email: 'redactie@klushulpgids.nl',
      contactType: 'editorial',
      availableLanguage: ['Dutch'],
    },
  ],
}

export default function ContactPage() {
  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      </div>

      <article className={styles.article}>
        <header className={styles.head}>
          <EmDashLabel>Contact</EmDashLabel>
          <h1 className={styles.title}>
            Vragen aan de <em className={styles.italic}>redactie</em>.
          </h1>
        </header>

        <p className={styles.body}>
          Voor correcties, klachten, claim-aanvragen of redactionele vragen kunt u ons rechtstreeks
          mailen:
        </p>

        <p className={styles.email}>
          <a href="mailto:redactie@klushulpgids.nl">redactie@klushulpgids.nl</a>
        </p>

        <p className={styles.body}>
          Vermeld bij correctie­verzoeken graag uw KvK-nummer en het profiel-URL of de juiste
          vermelding. Wij antwoorden binnen 5 werkdagen; bij privacy-verzoeken (AVG-rechten) binnen
          14 dagen.
        </p>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Container>
  )
}
