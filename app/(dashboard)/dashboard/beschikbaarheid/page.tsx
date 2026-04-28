import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { AvailabilityPicker } from './AvailabilityPicker'
import styles from '../shared.module.css'

export const metadata: Metadata = {
  title: 'Beschikbaarheid',
  robots: { index: false, follow: false },
}

export default async function BeschikbaarheidPage() {
  const session = await auth()
  if (!session?.user.tradespersonId) redirect('/dashboard/welkom')

  const tp = await prisma.tradesperson.findUnique({
    where: { id: session.user.tradespersonId },
    select: { availabilityStatus: true, availabilityUpdatedAt: true },
  })
  if (!tp) redirect('/dashboard/welkom')

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Beschikbaarheid</p>
        <h1 className={styles.h1}>Wanneer kunt u aan de slag?</h1>
        <p className={styles.lede}>
          Klanten zien deze status bovenaan uw profiel. Houd hem actueel — profielen met recente
          updates worden vaker geclickt.
        </p>
      </header>

      <AvailabilityPicker
        current={tp.availabilityStatus}
        updatedAt={tp.availabilityUpdatedAt?.toISOString() ?? null}
      />
    </div>
  )
}
