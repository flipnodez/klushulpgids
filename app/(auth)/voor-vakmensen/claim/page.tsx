import type { Metadata } from 'next'
import Link from 'next/link'

import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'

import { ClaimForm } from './ClaimForm'
import styles from '../../inloggen/page.module.css'

export const metadata: Metadata = {
  title: 'Claim uw bedrijfsprofiel',
  description:
    'Bent u eigenaar van een vakbedrijf dat in de Klushulpgids staat? Claim uw gratis profiel — geen lead-fee, geen tussenpersoon.',
  robots: { index: true, follow: true },
}

export default function ClaimPage() {
  return (
    <Container>
      <article className={styles.wrap}>
        <EmDashLabel>Vakmensen</EmDashLabel>
        <h1 className={styles.title}>
          Claim uw <em className={styles.italic}>gratis</em> profiel
        </h1>
        <p className={styles.lede}>
          Vul hieronder uw KvK-nummer in. Wij sturen een inlog-link naar het e-mailadres dat in onze
          gids bij uw bedrijf bekend is.
        </p>

        <ClaimForm />

        <p className={styles.foot}>
          Geen profiel kunnen vinden?{' '}
          <Link href="/contact" className={styles.link}>
            Neem contact op met onze redactie
          </Link>{' '}
          — wij maken een nieuw profiel voor u aan.
        </p>
      </article>
    </Container>
  )
}
