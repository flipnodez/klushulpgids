import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { auth, signOut } from '@/lib/auth'

import { AdminNav } from './AdminNav'
import styles from './layout.module.css'

export const dynamic = 'force-dynamic'
export const metadata = {
  robots: { index: false, follow: false },
  title: { default: 'Admin', template: '%s · Klushulpgids Admin' },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/inloggen?callbackUrl=/admin')
  if (session.user.role !== 'ADMIN' && session.user.role !== 'EDITOR') {
    redirect('/')
  }

  return (
    <div className={styles.shell}>
      <header className={styles.head}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>
            Klushulpgids
          </Link>
          <span className={styles.tag}>— Admin</span>
        </div>
        <div className={styles.user}>
          <span className={styles.userEmail}>
            {session.user.email}
            <span className={styles.userRole}>{session.user.role}</span>
          </span>
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
        <AdminNav role={session.user.role} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
