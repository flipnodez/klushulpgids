import { prisma } from '@/lib/db'

import { BlacklistManager } from './BlacklistManager'
import styles from '../shared.module.css'

export const metadata = { title: 'Blacklist' }
export const dynamic = 'force-dynamic'

export default async function BlacklistPage() {
  const items = await prisma.optOutBlacklist.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      kvkNumber: true,
      emailHash: true,
      reason: true,
      createdAt: true,
    },
  })

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Admin · Blacklist</p>
        <h1 className={styles.h1}>Opt-out blacklist</h1>
        <p className={styles.lede}>
          KvK-nummers en e-mailhashes die uit imports worden uitgesloten en die geen reviews mogen
          indienen. Bevat ook GDPR-deletes.
        </p>
      </header>

      <BlacklistManager
        items={items.map((i) => ({
          ...i,
          createdAt: i.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
