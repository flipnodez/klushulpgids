import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'

import styles from '../page.module.css'

export const metadata: Metadata = {
  title: 'Inloggen mislukt',
  robots: { index: false, follow: false },
}

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'Er is een server-configuratie probleem. Onze redactie is op de hoogte.',
  AccessDenied: 'Geen toegang. Mogelijk is uw profiel verwijderd of geblokkeerd.',
  Verification: 'Deze inlog-link is niet meer geldig. Mogelijk is de link verlopen of al gebruikt.',
  Default: 'Er ging iets mis bij het inloggen. Probeer het opnieuw.',
}

export default async function LoginErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  const message = (sp.error && ERROR_MESSAGES[sp.error]) ?? ERROR_MESSAGES.Default

  return (
    <Container>
      <div className={styles.crumbs}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Inloggen', href: '/inloggen' },
            { label: 'Foutmelding' },
          ]}
        />
      </div>
      <article className={styles.wrap}>
        <EmDashLabel>Foutmelding</EmDashLabel>
        <h1 className={styles.title}>Er ging iets mis</h1>
        <p className={styles.lede}>{message}</p>

        <div className={styles.form}>
          <Link href="/inloggen" className={styles.link}>
            → Probeer opnieuw
          </Link>
        </div>

        <p className={styles.foot}>
          Blijft het probleem? Mail{' '}
          <a className={styles.link} href="mailto:support@klushulpgids.nl">
            support@klushulpgids.nl
          </a>
          .
        </p>
      </article>
    </Container>
  )
}
