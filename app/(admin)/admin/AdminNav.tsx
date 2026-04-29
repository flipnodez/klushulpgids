'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

import styles from './layout.module.css'

type Role = 'ADMIN' | 'EDITOR' | 'TRADESPERSON' | 'CONSUMER'

type Item = {
  href: string
  label: string
  roles: Role[]
}

const ITEMS: Item[] = [
  { href: '/admin', label: 'Overzicht', roles: ['ADMIN', 'EDITOR'] },
  { href: '/admin/vakmensen', label: 'Vakmensen', roles: ['ADMIN', 'EDITOR'] },
  { href: '/admin/reviews', label: 'Reviews', roles: ['ADMIN', 'EDITOR'] },
  { href: '/admin/blog', label: 'Blog', roles: ['ADMIN', 'EDITOR'] },
  { href: '/admin/import', label: 'Import', roles: ['ADMIN'] },
  { href: '/admin/gebruikers', label: 'Gebruikers', roles: ['ADMIN'] },
  { href: '/admin/blacklist', label: 'Blacklist', roles: ['ADMIN'] },
  { href: '/admin/compliance', label: 'Compliance log', roles: ['ADMIN'] },
]

export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname()
  const items = ITEMS.filter((i) => i.roles.includes(role))

  return (
    <nav className={styles.nav} aria-label="Admin navigatie">
      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
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
