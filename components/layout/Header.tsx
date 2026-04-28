import type { ReactNode } from 'react'
import { clsx } from 'clsx'
import Link from 'next/link'

import { Logo } from '../ui/Logo'
import { MobileNav } from './MobileNav'
import styles from './Header.module.css'

type NavItem = {
  label: string
  href: string
  /** Markeert deze link als actief (rode kleur) */
  current?: boolean
  /** External-link, opent in nieuw tab */
  external?: boolean
}

type HeaderProps = {
  /** Linker tekst in de top-bar — default datum-stempel */
  topLeft?: ReactNode
  /** Rechter tekst in de top-bar — default leeg, zet in fase 4 als business-model bekend is */
  topRight?: ReactNode
  /** Navigatie items in de hoofdbar — default standaard set */
  nav?: NavItem[]
  /** Sticky-positionering (default true voor desktop) */
  sticky?: boolean
  className?: string
}

const DEFAULT_NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Vakgebieden', href: '/vakgebieden' },
  { label: 'Steden', href: '/steden' },
  { label: 'Zoeken', href: '/zoeken' },
  { label: 'Onze werkwijze', href: '/over-ons' },
  { label: 'Voor vakmensen', href: '/voor-vakmensen' },
]

function defaultDateStamp() {
  const today = new Date()
  const fmt = new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(today)
  return fmt.charAt(0).toUpperCase() + fmt.slice(1)
}

/**
 * Editorial masthead, conform `Design concept/components.jsx`:
 *  - Top bar: datum-stempel links, optionele tagline rechts
 *  - Main bar: Logo + horizontale nav
 *
 * Server-component renderable — geen client-state intern. De theme-toggle
 * en mobile menu komen in fase 4 als aparte client-componenten.
 *
 * **Belangrijk**: business-claims zoals "geen lead-fee" zijn placeholders
 * (zie `00-overzicht.md` — verdienmodel TBD); zet deze pas via `topRight`
 * wanneer die zijn vastgesteld.
 */
export function Header({
  topLeft,
  topRight,
  nav = DEFAULT_NAV,
  sticky = true,
  className,
}: HeaderProps) {
  return (
    <header className={clsx(styles.masthead, sticky && styles.sticky, className)}>
      <div className={styles.top}>
        <span className="label label-muted">{topLeft ?? defaultDateStamp()}</span>
        {topRight !== undefined ? (
          topRight && <span className="label label-accent">{topRight}</span>
        ) : (
          <span className={clsx('label label-muted', styles.topLinks)}>
            <Link href="/voor-vakmensen/claim" className={styles.topLink}>
              Vakman? Claim profiel
            </Link>
            <span aria-hidden="true" className={styles.topSep}>
              ·
            </span>
            <Link href="/inloggen" className={styles.topLink}>
              Inloggen
            </Link>
          </span>
        )}
      </div>
      <div className={styles.main}>
        <Link href="/" className="plain" aria-label="Naar home">
          <Logo size="md" />
        </Link>
        <nav className={styles.nav} aria-label="Hoofdnavigatie">
          {nav.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                className={clsx('plain', styles.link, item.current && styles.current)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={clsx('plain', styles.link, item.current && styles.current)}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <MobileNav nav={nav} />
      </div>
    </header>
  )
}
