'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'

import { Icon } from '../ui/Icon'
import styles from './MobileNav.module.css'

type NavItem = {
  label: string
  href: string
  current?: boolean
  external?: boolean
}

type Props = {
  nav: NavItem[]
}

export function MobileNav({ nav }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-label={open ? 'Menu sluiten' : 'Menu openen'}
        aria-expanded={open}
        aria-controls="mobile-nav-overlay"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? 'X' : 'Menu'} size={26} strokeWidth={1.5} />
      </button>

      <div
        id="mobile-nav-overlay"
        className={clsx(styles.overlay, open && styles.open)}
        aria-hidden={!open}
      >
        <nav className={styles.nav} aria-label="Mobiele navigatie">
          {nav.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                className={clsx('plain', styles.link, item.current && styles.current)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={clsx('plain', styles.link, item.current && styles.current)}
                aria-current={item.current ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}

          <div className={styles.actions}>
            <Link
              href="/voor-vakmensen/claim"
              className={clsx('plain', styles.actionPrimary)}
              onClick={() => setOpen(false)}
            >
              Profiel claimen →
            </Link>
            <Link
              href="/inloggen"
              className={clsx('plain', styles.actionSecondary)}
              onClick={() => setOpen(false)}
            >
              Inloggen
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}
