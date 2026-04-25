import type { Metadata } from 'next'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'

import styles from '../legal.module.css'

export const metadata: Metadata = {
  title: 'Algemene voorwaarden',
  description: 'Algemene voorwaarden voor het gebruik van Klushulpgids — concept, founder reviewt.',
  alternates: { canonical: '/voorwaarden' },
}

export default function VoorwaardenPage() {
  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Voorwaarden' }]} />
      </div>

      <article className={styles.article}>
        <header className={styles.head}>
          <EmDashLabel>Juridisch</EmDashLabel>
          <h1 className={styles.title}>Algemene voorwaarden</h1>
          <p className="muted text-sm">
            Laatst gewijzigd: 25 april 2026 · concept (founder reviewt)
          </p>
        </header>

        <Rule variant="thick" />

        <section className={styles.section}>
          <h2>1. Wat is Klushulpgids</h2>
          <p>
            Klushulpgids.nl is een redactioneel naslagwerk van vakmensen in Nederland. De gids
            fungeert <em>niet</em> als bemiddelaar of tussenpersoon. Bezoekers nemen rechtstreeks
            contact op met de getoonde vakmensen.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Geen aansprakelijkheid voor uitvoering</h2>
          <p>
            Klushulpgids is niet partij bij overeen­komsten tussen bezoekers en vakmensen, en is
            niet aansprakelijk voor de kwaliteit, kosten of tijdige uitvoering van werk uitgevoerd
            door vakmensen die in de gids worden vermeld. Wij doen redelijke inspanningen om
            gegevens accuraat te tonen.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. Gebruiks­voorwaarden</h2>
          <p>
            Het is toegestaan om links naar pagina&apos;s van Klushulpgids te delen. Het is niet
            toegestaan om grote hoeveel­heden gegevens uit de gids geautomatiseerd te scrapen, te
            kopiëren of door te verkopen. Misbruik leidt tot blokkade en eventueel
            rechts­vervolging.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. Reviews</h2>
          <p>
            Reviews worden gemodereerd. Wij verwijderen reviews die kennelijk onjuist, beledigend,
            irrelevant of in strijd zijn met de wet. Reviewers garanderen dat hun ervaring
            authentiek is. Wij behouden ons het recht voor reviews zonder opgaaf van reden te
            weigeren of te verwijderen.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Verwijdering uit de gids</h2>
          <p>
            Vakmensen kunnen verzoeken hun profiel uit de gids te verwijderen. Stuur een mail met
            KvK-nummer naar <a href="mailto:redactie@klushulpgids.nl">redactie@klushulpgids.nl</a>;
            verwijdering binnen 14 dagen.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Wijzigingen</h2>
          <p>
            Wij kunnen deze voorwaarden aanpassen. Substantiële wijzigingen worden aangekondigd op
            deze pagina.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Toepasselijk recht</h2>
          <p>
            Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan
            de bevoegde rechter te Utrecht.
          </p>
        </section>
      </article>
    </Container>
  )
}
