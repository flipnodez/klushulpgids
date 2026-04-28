import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { auth, signOut } from '@/lib/auth'

import { DashboardNav } from './DashboardNav'
import styles from './layout.module.css'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/inloggen?callbackUrl=/dashboard')
  if (session.user.role !== 'TRADESPERSON' && session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className={styles.shell}>
      <header className={styles.head}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>
            Klushulpgids
          </Link>
          <span className={styles.tag}>— Dashboard</span>
        </div>
        <div className={styles.user}>
          <span className={styles.userEmail}>{session.user.email}</span>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}
          >
            <button className={styles.signout} type="submit">
              Uitloggen
            </button>
          </form>
        </div>
      </header>
      <div className={styles.grid}>
        <DashboardNav />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
