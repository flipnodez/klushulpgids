import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'

import styles from '../inloggen/page.module.css'

export const metadata: Metadata = {
  title: 'Controleer uw mailbox',
  robots: { index: false, follow: false },
}

export default async function VerifyRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const sp = await searchParams
  return (
    <Container>
      <div className={styles.crumbs}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Inloggen', href: '/inloggen' },
            { label: 'Controleer uw mail' },
          ]}
        />
      </div>
      <article className={styles.wrap}>
        <EmDashLabel>Verstuurd</EmDashLabel>
        <h1 className={styles.title}>Controleer uw mailbox</h1>
        <p className={styles.lede}>
          Wij hebben u zojuist een inlog-link gestuurd
          {sp.email ? (
            <>
              {' '}
              naar <strong>{sp.email}</strong>
            </>
          ) : null}
          . Klik op de link in die e-mail om in te loggen — de link is 24 uur geldig.
        </p>

        <div className={styles.form}>
          <p className={styles.helper}>
            <strong>Niet ontvangen?</strong> Check uw spam-folder, of probeer het opnieuw met een
            ander e-mailadres.
          </p>
        </div>

        <p className={styles.foot}>
          <Link href="/inloggen" className={styles.link}>
            ← Terug naar inloggen
          </Link>
        </p>
      </article>
    </Container>
  )
}
