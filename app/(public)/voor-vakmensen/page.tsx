import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Voor vakmensen',
  description:
    'Vakmensen kunnen kosteloos hun profiel claimen en bijwerken in Klushulpgids — onafhankelijk, KvK-geverifieerd, geen lead-fee.',
  alternates: { canonical: '/voor-vakmensen' },
}

export default function VoorVakmensenPage() {
  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Voor vakmensen' }]} />
      </div>

      <article className={styles.article}>
        <header className={styles.head}>
          <EmDashLabel>Voor vakmensen</EmDashLabel>
          <h1 className={styles.title}>
            Plaatsing in de gids is <em className={styles.italic}>gratis</em>.
          </h1>
          <p className={styles.lede}>
            Klushulpgids verkoopt geen leads en vraagt geen fee per klus. U kunt uw profiel
            kosteloos claimen, bijwerken en zelf bepalen welke informatie zichtbaar is.
          </p>
        </header>

        <Rule variant="thick" />

        <section className={styles.section}>
          <h2 className={styles.h2}>Wat krijgt u?</h2>
          <ol className={styles.list}>
            <li>
              <strong>Een gratis profiel</strong> in de gids met uw bedrijfsnaam, vakgebied,
              contactgegevens, certificeringen en branche­verenigings­lidmaatschap.
            </li>
            <li>
              <strong>Directe contact­leads</strong> — bezoekers bellen of mailen rechtstreeks. Geen
              tussenpersoon, geen offerte­wedloop, geen lead-fee.
            </li>
            <li>
              <strong>Reviews onder uw beheer</strong> — u kunt reageren op beoordelingen en
              duidelijk uitleg geven bij minder positieve ervaringen.
            </li>
            <li>
              <strong>Beschikbaarheid bijwerken</strong> in uw dashboard — laat klanten zien dat u
              nieuwe klussen aankunt.
            </li>
          </ol>
        </section>

        <Rule variant="soft" />

        <section className={styles.section}>
          <h2 className={styles.h2}>Profiel claimen</h2>
          <p className={styles.body}>
            Uw bedrijf staat mogelijk al in de gids — wij verzamelen publieke gegevens uit Kamer van
            Koophandel en branche­verenigingen. U kunt uw profiel claimen via uw KvK-nummer: wij
            sturen een eenmalige inlog-link naar het bekende e-mailadres van uw bedrijf, daarna
            staat u zelf aan het roer.
          </p>

          <div className={styles.ctaRow}>
            <Link href="/voor-vakmensen/claim" className={styles.ctaPrimary}>
              Claim uw profiel →
            </Link>
            <Link href="/inloggen" className={styles.ctaSecondary}>
              Reeds geclaimd? Inloggen
            </Link>
          </div>

          <p className={styles.body}>
            Geen profiel kunnen vinden? Mail{' '}
            <a href="mailto:redactie@klushulpgids.nl">redactie@klushulpgids.nl</a> met uw
            bedrijfsnaam en KvK-nummer — onze redactie maakt dan een nieuw profiel voor u aan.
          </p>
        </section>

        <Rule variant="soft" />

        <section className={styles.section}>
          <h2 className={styles.h2}>Veelgestelde vragen</h2>
          <dl className={styles.faq}>
            <dt>Wat kost het?</dt>
            <dd>
              Plaatsing in de basisgids is gratis. Premium-features komen later beschikbaar; details
              volgen.
            </dd>

            <dt>Kan ik mijn profiel verwijderen?</dt>
            <dd>
              Ja. Mail <a href="mailto:redactie@klushulpgids.nl">redactie@klushulpgids.nl</a> met uw
              KvK-nummer; binnen 14 dagen wordt u uit de gids verwijderd (AVG-recht).
            </dd>

            <dt>Hoe komt mijn rating tot stand?</dt>
            <dd>
              Wij combineren eigen reviews (gemodereerd) met openbare beoordelingen op externe
              platforms zoals Klantenvertellen of Google. Bronnen worden altijd vermeld bij het
              cijfer.
            </dd>

            <dt>Wordt mijn data verkocht?</dt>
            <dd>
              Nee. Bezoekers­gegevens worden niet doorverkocht. Wij gebruiken cookieless analytics
              (Plausible) zonder profielen of advertentie­ID&apos;s.
            </dd>
          </dl>
        </section>
      </article>
    </Container>
  )
}
