import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { ProfileForm } from './ProfileForm'
import styles from '../shared.module.css'

export const metadata: Metadata = {
  title: 'Profiel bewerken',
  robots: { index: false, follow: false },
}

export default async function ProfielPage() {
  const session = await auth()
  if (!session?.user.tradespersonId) redirect('/dashboard/welkom')

  const tp = await prisma.tradesperson.findUnique({
    where: { id: session.user.tradespersonId },
    select: {
      companyName: true,
      kvkNumber: true,
      kvkVerified: true,
      description: true,
      phone: true,
      websiteUrl: true,
      hourlyRateMin: true,
      hourlyRateMax: true,
      emergencyService: true,
      slug: true,
    },
  })
  if (!tp) redirect('/dashboard/welkom')

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Profiel</p>
        <h1 className={styles.h1}>{tp.companyName}</h1>
        <p className={styles.lede}>
          Bewerk de openbare informatie op{' '}
          <a href={`/vakman/${tp.slug}`} target="_blank" rel="noopener noreferrer">
            uw publieke profiel
          </a>
          .
        </p>
      </header>

      <ProfileForm initial={tp} />
    </div>
  )
}
