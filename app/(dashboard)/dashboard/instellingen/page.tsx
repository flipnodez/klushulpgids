import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { SettingsForms } from './SettingsForms'
import styles from '../shared.module.css'

export const metadata: Metadata = {
  title: 'Instellingen',
  robots: { index: false, follow: false },
}

export default async function InstellingenPage() {
  const session = await auth()
  if (!session?.user.tradespersonId) redirect('/dashboard/welkom')

  const [user, tp] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notifyNewReview: true,
        notifyMonthlyStats: true,
        notifyAvailabilityReminder: true,
      },
    }),
    prisma.tradesperson.findUnique({
      where: { id: session.user.tradespersonId },
      select: { profileActive: true, companyName: true },
    }),
  ])

  if (!user || !tp) redirect('/dashboard/welkom')

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Instellingen</p>
        <h1 className={styles.h1}>Voorkeuren & privacy</h1>
        <p className={styles.lede}>E-mailnotificaties, profiel-zichtbaarheid en GDPR-opties.</p>
      </header>

      <SettingsForms
        notifications={user}
        profileActive={tp.profileActive}
        companyName={tp.companyName}
      />
    </div>
  )
}
