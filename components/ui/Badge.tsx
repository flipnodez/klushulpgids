import type { HTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

import styles from './Badge.module.css'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'accent' | 'success' | 'muted'
  /** Optionele dot-prefix (groen voor `success` etc.) */
  dot?: boolean
  children: ReactNode
}

/**
 * Klein label met uppercase tracked tekst. Geen rounded corners (radius 2px).
 * Voor stamp-stijl ("✓ Onafhankelijk", rode outline) gebruik {@link Stamp}.
 */
export function Badge({ variant = 'default', dot, className, children, ...rest }: BadgeProps) {
  return (
    <span className={clsx(styles.badge, styles[variant], className)} {...rest}>
      {dot && <span aria-hidden="true" className={clsx(styles.dot, styles[`dot_${variant}`])} />}
      {children}
    </span>
  )
}
