import type { ReactNode } from 'react'
import { clsx } from 'clsx'

import { Logo } from '../ui/Logo'
import styles from './Footer.module.css'

type FooterColumn = {
  label: string
  links: { label: string; href: string }[]
}

type FooterProps = {
  /** Default kolommen — Categorieën, Steden, Uitgave */
  columns?: FooterColumn[]
  /** Tagline onder de logo — default editorial neutrale versie */
  tagline?: ReactNode
  /** Stamps (zoals "✓ Onafhankelijk"). Geen claims over verdienmodel hardcoderen */
  stamps?: ReactNode
  /** Bottom-line copyright tekst (links) */
  copyright?: ReactNode
  /** Bottom-line legal tekst (rechts) */
  legal?: ReactNode
  className?: string
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    label: 'Vakgebieden',
    links: [
      { label: 'Loodgieters', href: '/loodgieters' },
      { label: 'Elektriciens', href: '/elektriciens' },
      { label: 'Schilders', href: '/schilders' },
      { label: 'Stukadoors', href: '/stukadoors' },
      { label: 'Tegelzetters', href: '/tegelzetters' },
      { label: 'Alle vakgebieden', href: '/vakgebieden' },
    ],
  },
  {
    label: 'Steden',
    links: [
      { label: 'Amsterdam', href: '/plaats/amsterdam' },
      { label: 'Rotterdam', href: '/plaats/rotterdam' },
      { label: 'Utrecht', href: '/plaats/utrecht' },
      { label: 'Den Haag', href: '/plaats/den-haag' },
      { label: 'Eindhoven', href: '/plaats/eindhoven' },
      { label: 'Alle steden', href: '/steden' },
    ],
  },
  {
    label: 'Uitgave',
    links: [
      { label: 'Onze werkwijze', href: '/over-ons' },
      { label: 'Voor vakmensen', href: '/voor-vakmensen' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Voorwaarden', href: '/voorwaarden' },
    ],
  },
]

/**
 * Editorial colofon-style footer — 4 kolommen op desktop:
 *  1. Logo + tagline + optionele stamps
 *  2-4. Linklijsten per rubriek
 *
 * Bottom: copyright + legal info, gescheiden door rule-soft.
 *
 * Geen social-icons (past niet bij editorial). Geen newsletter-signup
 * (past pas in fase 7+ als onderdeel van content-marketing).
 */
export function Footer({
  columns = DEFAULT_COLUMNS,
  tagline = 'De onafhankelijke gids voor Nederlandse ambachtslieden.',
  stamps,
  copyright = `© ${new Date().getFullYear()} Klushulpgids.nl — Een onafhankelijke consumentengids.`,
  legal,
  className,
}: FooterProps) {
  return (
    <footer className={clsx(styles.footer, className)}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <Logo size="md" />
            <p className={clsx('muted', 'text-sm', styles.tagline)}>{tagline}</p>
            {stamps && <div className="row row-gap-2">{stamps}</div>}
          </div>

          {columns.map((col) => (
            <div key={col.label}>
              <div className={clsx('label', 'label-muted', styles.colLabel)}>{col.label}</div>
              <ul className={styles.linkList}>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <a className="plain" href={l.href}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="rule-soft" style={{ margin: '32px 0 16px' }} />

        <div className={styles.bottom}>
          <span>{copyright}</span>
          {legal && <span>{legal}</span>}
        </div>
      </div>
    </footer>
  )
}
