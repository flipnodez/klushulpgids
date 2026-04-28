import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'

import { LoginForm } from './LoginForm'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Inloggen voor vakmensen',
  description:
    'Log in op uw Klushulpgids-dashboard met een magic link. Beheer uw profiel, foto’s, beschikbaarheid en reviews.',
  robots: { index: false, follow: false },
}

type SearchParams = { callbackUrl?: string; email?: string }

export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  return (
    <Container>
      <div className={styles.crumbs}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Inloggen' }]} />
      </div>
      <article className={styles.wrap}>
        <EmDashLabel>Toegang</EmDashLabel>
        <h1 className={styles.title}>
          Inloggen voor <em className={styles.italic}>vakmensen</em>
        </h1>
        <p className={styles.lede}>Wij sturen u een eenmalige inlog-link. Geen wachtwoord nodig.</p>

        <LoginForm callbackUrl={sp.callbackUrl} initialEmail={sp.email} />

        <p className={styles.foot}>
          Nog geen profiel?{' '}
          <Link href="/voor-vakmensen/claim" className={styles.link}>
            Claim uw gratis vermelding
          </Link>
          .
        </p>
      </article>
    </Container>
  )
}
