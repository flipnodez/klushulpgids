import { clsx } from 'clsx'

import styles from './Logo.module.css'

type LogoProps = {
  /** `sm` 22px, `md` 30px (default), `lg` 44px */
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Render als plain text zonder link wrapping */
  asText?: boolean
}

/**
 * `Klushulpgids.nl` met rode `.` en italic `nl` — signature logo zoals
 * gedefinieerd in `Design concept/components.jsx`.
 *
 * Waarom geen `<svg>`? De typografie is wat het logo MAAKT — Source Serif 4
 * 500 met de exacte letter-spacing. Een SVG zou de webfont moeten embedden
 * of een fallback geven. Met live-text werkt het automatisch op alle devices,
 * is het selecteerbaar, en past het zich aan dark-mode aan.
 */
export function Logo({ size = 'md', className, asText }: LogoProps) {
  const Element = asText ? 'span' : 'span'
  return (
    <Element
      className={clsx('serif', styles.logo, styles[size], className)}
      aria-label="Klushulpgids.nl"
    >
      Klushulpgids
      <span aria-hidden="true" className={styles.dot}>
        .
      </span>
      <em aria-hidden="true">nl</em>
    </Element>
  )
}
