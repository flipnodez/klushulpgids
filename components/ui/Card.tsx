import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

import styles from './Card.module.css'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * - `default`     — 1px ink border (kern editorial-look)
   * - `soft`        — 1px rule-soft border, voor binnen-listings
   * - `paper-stamp` — 1px ink + 4px 4px 0 ink shadow (papieren-knipsel)
   * - `entry`       — listing-row, hover wisselt achtergrond
   */
  variant?: 'default' | 'soft' | 'paper-stamp' | 'entry'
  /** Default 0 (geen padding); zet padding via context indien nodig */
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

/**
 * Editorial container met 1px border. **Geen rounded corners** (radius 2px max),
 * **geen schaduwen** behalve `paper-stamp` variant.
 */
export function Card({ variant = 'default', padding = 'none', className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(styles.card, styles[`v_${variant}`], styles[`p_${padding}`], className)}
      {...rest}
    />
  )
}
