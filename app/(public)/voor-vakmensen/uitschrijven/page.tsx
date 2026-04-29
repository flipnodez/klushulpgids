import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'

import { UnsubscribeRequestForm } from './UnsubscribeRequestForm'
import { UnsubscribeConfirmForm } from './UnsubscribeConfirmForm'

import styles from '../../inloggen/page.module.css'

export const metadata: Metadata = {
  title: 'Profiel verwijderen',
  description:
    'Vakmensen kunnen hun profiel laten verwijderen uit de Klushulpgids. Een AVG-recht — wij verwerken uw verzoek binnen enkele seconden.',
  robots: { index: false, follow: false },
}

type SearchParams = { token?: string; id?: string }

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const hasToken = !!(sp.token && sp.id)

  return (
    <Container>
      <div className={styles.crumbs}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Voor vakmensen', href: '/voor-vakmensen' },
            { label: 'Uitschrijven' },
          ]}
        />
      </div>
      <article className={styles.wrap}>
        <EmDashLabel>Uitschrijven</EmDashLabel>
        {hasToken ? (
          <>
            <h1 className={styles.title}>
              Bevestig <em className={styles.italic}>verwijdering</em>
            </h1>
            <p className={styles.lede}>
              Klik op de knop hieronder om de verwijdering van uw profiel definitief te maken.
              Reviews, foto’s en uw account worden ook verwijderd.
            </p>
            <UnsubscribeConfirmForm token={sp.token!} id={sp.id!} />
          </>
        ) : (
          <>
            <h1 className={styles.title}>
              Verwijder uw <em className={styles.italic}>profiel</em>
            </h1>
            <p className={styles.lede}>
              Vul uw KvK-nummer of het e-mailadres in dat bij ons bekend is. Wij sturen een
              bevestigingslink — pas na klikken wordt uw profiel verwijderd.
            </p>
            <UnsubscribeRequestForm />
            <p className={styles.foot}>
              Liever zelf inloggen?{' '}
              <Link href="/inloggen" className={styles.link}>
                Log in op uw dashboard
              </Link>{' '}
              en gebruik &ldquo;Profiel verwijderen&rdquo; in Instellingen.
            </p>
          </>
        )}
      </article>
    </Container>
  )
}
