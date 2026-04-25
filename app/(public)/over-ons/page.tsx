import type { Metadata } from 'next'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { DropCap } from '@/components/ui/DropCap'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Over ons',
  description:
    'Klushulpgids is een onafhankelijke consumentengids voor Nederlandse vakmensen — onafhankelijk, KvK-geverifieerd en zonder lead-fee.',
  alternates: { canonical: '/over-ons' },
}

export default function OverOnsPage() {
  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Over ons' }]} />
      </div>

      <article className={styles.article}>
        <header className={styles.head}>
          <EmDashLabel>Over Klushulpgids</EmDashLabel>
          <h1 className={styles.title}>
            Een gids, geen <em className={styles.italic}>makelaar</em>.
          </h1>
        </header>

        <DropCap className={styles.lede}>
          Klushulpgids is een onafhankelijk redactioneel project dat Nederlandse ambachtslieden in
          kaart brengt. De gids put uit publieke bronnen — Kamer van Koophandel,
          branche­verenigingen, en eventuele eigen beoordelingen — en publiceert dat zonder
          commerciële beïnvloeding van de listings.
        </DropCap>

        <Rule variant="soft" />

        <h2 className={styles.h2}>Onze werkwijze</h2>
        <p className={styles.body}>
          Wij verzamelen, controleren, en publiceren — meer niet. Profielen zijn KvK-geverifieerd:
          elk bedrijf in de gids is actief geregistreerd bij de Kamer van Koophandel. De vakman kan
          zijn profiel zelf claimen om gegevens bij te werken; daarna staat hij of zij zelf aan het
          roer over wat wel en niet getoond wordt.
        </p>

        <h2 className={styles.h2}>Onze redactionele principes</h2>
        <ol className={styles.list}>
          <li>
            <strong>Onafhankelijk.</strong> Wij verdienen niets aan uw klus. Geen
            offerteformulieren, geen tussenpersoon, geen lead-fee voor de vakman.
          </li>
          <li>
            <strong>Feitelijk.</strong> Beweringen zijn controleerbaar; bronnen worden vermeld waar
            mogelijk.
          </li>
          <li>
            <strong>Transparant.</strong> Sortering en plaatsing in listings volgt kwaliteit en
            beoordeling — niet betalingen. Eventuele gesponsorde plaatsen zijn altijd duidelijk
            gemarkeerd.
          </li>
          <li>
            <strong>Privacy-vriendelijk.</strong> Geen tracking-cookies, geen doorverkoop van
            bezoekersgegevens. Bezoekers­statistieken via Plausible (cookieless).
          </li>
        </ol>

        <h2 className={styles.h2}>Waarom Klushulpgids bestaat</h2>
        <p className={styles.body}>
          De Nederlandse markt voor vakmensen wordt gedomineerd door lead-platforms die per
          offerte­aanvraag betaald worden. Voor de consument betekent dat eindeloze
          offerte­wedlopen; voor de vakman een steeds duurder lid­maatschap. Klushulpgids is bedoeld
          als rustig alternatief: vergelijk zelf, bel direct, gebruik onze gids niet als marktplaats
          maar als naslagwerk.
        </p>

        <h2 className={styles.h2}>De redactie</h2>
        <p className={styles.body}>
          Het project wordt onderhouden door een onafhankelijk team van redacteuren en developers.
          Vragen, correcties of klachten:{' '}
          <a href="mailto:redactie@klushulpgids.nl">redactie@klushulpgids.nl</a>.
        </p>
      </article>
    </Container>
  )
}
