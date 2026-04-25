import type { Metadata } from 'next'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'

import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: 'Privacyverklaring',
  description:
    'Hoe Klushulpgids uw gegevens verwerkt — op basis van AVG, met versleutelde opslag en zonder doorverkoop.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Privacy' }]} />
      </div>

      <article className={styles.article}>
        <header className={styles.head}>
          <EmDashLabel>Juridisch</EmDashLabel>
          <h1 className={styles.title}>Privacyverklaring</h1>
          <p className="muted text-sm">
            Laatst gewijzigd: 25 april 2026 · concept (founder reviewt)
          </p>
        </header>

        <Rule variant="thick" />

        <section className={styles.section}>
          <h2>1. Wie zijn wij</h2>
          <p>
            Klushulpgids.nl is een redactioneel project. Voor privacy-vragen of het uitoefenen van
            AVG-rechten kunt u mailen naar{' '}
            <a href="mailto:redactie@klushulpgids.nl">redactie@klushulpgids.nl</a>.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Welke gegevens verwerken wij</h2>
          <p>
            <strong>Van vakmensen:</strong> bedrijfsnaam, KvK-nummer, BTW-nummer, vestigingsadres,
            telefoon, website, branche­vereniging, certificeringen, specialisaties — alle uit
            publieke bronnen of door de vakman zelf aangedragen. E-mailadressen worden versleuteld
            opgeslagen (AES-256-GCM).
          </p>
          <p>
            <strong>Van bezoekers:</strong> alleen geaggregeerde, anonieme bezoekers­statistieken
            via Plausible (cookieless). Geen IP-adressen, geen apparaat-fingerprints, geen
            tracking-cookies. Wanneer u zelf contact opneemt (claim, review, mail), bewaren we de
            verstrekte gegevens om te kunnen reageren.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. Grondslag</h2>
          <p>
            Voor de gids hanteren wij de grondslag <em>gerechtvaardigd belang</em> (artikel 6 lid 1f
            AVG): een onafhankelijke, journalistieke gids voor consumenten. Vakmensen kunnen via{' '}
            <a href="mailto:redactie@klushulpgids.nl">redactie@klushulpgids.nl</a> verzoeken om
            verwijdering uit de gids (recht op vergetelheid). Reviews worden bewaard op grond van
            toestemming van de reviewer.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. Bewaartermijnen</h2>
          <ul>
            <li>Profielgegevens: zolang het bedrijf actief KvK-geregistreerd is</li>
            <li>Reviews: 5 jaar na publicatie of tot herroeping toestemming</li>
            <li>Mailverkeer: 2 jaar na laatste contact</li>
            <li>Bezoekersstatistieken: maximaal 12 maanden, geaggregeerd</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Vendors</h2>
          <p>
            Onze infrastructuur draait bij <strong>Scalingo</strong> (Frankrijk, EU-soeverein).
            Bezoekers­statistieken via <strong>Plausible</strong> (Duitsland). E-mail via{' '}
            <strong>Lettermint</strong> (Nederland). Geen Amerikaanse vendors voor opslag of
            verwerking van persoons­gegevens.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Uw rechten</h2>
          <p>
            U heeft recht op inzage, correctie, verwijdering, beperking, overdracht en bezwaar.
            Stuur een mail naar{' '}
            <a href="mailto:redactie@klushulpgids.nl">redactie@klushulpgids.nl</a> met een specifiek
            verzoek. Wij reageren binnen 14 dagen. Wij informeren u of het verzoek is uitgevoerd, en
            zo niet, waarom niet. U kunt een klacht indienen bij de Autoriteit Persoons­gegevens.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Wijzigingen</h2>
          <p>
            Wij kunnen deze verklaring aanpassen. Substantiële wijzigingen worden aangekondigd op
            deze pagina met een nieuwe datum bovenaan.
          </p>
        </section>
      </article>
    </Container>
  )
}
