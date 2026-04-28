'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

import styles from './layout.module.css'

const ITEMS = [
  { href: '/dashboard', label: 'Overzicht' },
  { href: '/dashboard/profiel', label: 'Profiel' },
  { href: '/dashboard/fotos', label: 'Foto’s' },
  { href: '/dashboard/beschikbaarheid', label: 'Beschikbaarheid' },
  { href: '/dashboard/reviews', label: 'Reviews' },
  { href: '/dashboard/instellingen', label: 'Instellingen' },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav} aria-label="Dashboard navigatie">
      {ITEMS.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(styles.navLink, isActive && styles.navLinkActive)}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
