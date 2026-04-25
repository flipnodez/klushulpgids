import { clsx } from 'clsx'

import styles from './Stars.module.css'

type StarsProps = {
  /** 0-5, half-stars worden afgerond per polygon (4.7 → 4 vol + 0.7 deels) */
  rating: number
  /** Aantal reviews — toont `(N)` achter de sterren */
  reviews?: number
  /** Toont het cijfer ("4.7") naast de sterren */
  showNumber?: boolean
  size?: 'sm' | 'lg'
  className?: string
}

const SIZE_PX = {
  sm: 13,
  lg: 20,
} as const

/**
 * Sterrenrating, identiek aan `components.jsx`. Stroke-color = warning amber.
 * Halve sterren werken via partial fill van de 5e ster.
 */
export function Stars({ rating, reviews, showNumber, size = 'sm', className }: StarsProps) {
  const px = SIZE_PX[size]
  const clamped = Math.max(0, Math.min(5, rating))
  const full = Math.floor(clamped)
  const half = clamped - full >= 0.5

  return (
    <span
      className={clsx('row row-gap-2', styles.wrap, className)}
      aria-label={`${clamped.toFixed(1)} van 5 sterren${reviews != null ? `, ${reviews} reviews` : ''}`}
    >
      <span className="stars" role="presentation">
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = i < full || (i === full && half)
          return (
            <svg
              key={i}
              width={px}
              height={px}
              viewBox="0 0 24 24"
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )
        })}
      </span>
      {showNumber && <span className={styles.number}>{clamped.toFixed(1)}</span>}
      {reviews != null && <span className="muted">({reviews})</span>}
    </span>
  )
}
