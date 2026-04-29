import { prisma } from '@/lib/db'

import { UserList } from './UserList'
import styles from '../shared.module.css'

export const metadata = { title: 'Gebruikers' }
export const dynamic = 'force-dynamic'

export default async function GebruikersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      tradespersonId: true,
      lastSignInAt: true,
      createdAt: true,
    },
  })

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Admin · Gebruikers</p>
        <h1 className={styles.h1}>Gebruikersbeheer</h1>
        <p className={styles.lede}>{users.length} gebruikers in de database.</p>
      </header>

      <UserList
        users={users.map((u) => ({
          ...u,
          lastSignInAt: u.lastSignInAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
