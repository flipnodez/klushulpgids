import type { ReactNode } from 'react'
import { clsx } from 'clsx'

import { DropCap } from '../../ui/DropCap'
import { Stars } from '../../ui/Stars'
import styles from './TradespersonHero.module.css'

type Stat = {
  label: string
  value: ReactNode
}

type TradespersonHeroProps = {
  companyName: string
  /** Eén italic woord — signature move. Bijv. "in *Utrecht*" → italic = "Utrecht" */
  italicWord?: string
  /** Subtitel onder de naam, bijv. "Loodgieter · Utrecht" */
  subtitle?: ReactNode
  description?: string
  /** Drop-cap behandeling op de eerste paragraaf */
  withDropCap?: boolean
  /** Stats-rij: bijv. KvK · Sinds 2004 · 4.8★ (143) */
  stats?: Stat[]
  /** Rating display — gewone Stars component */
  rating?: { rating: number; reviews?: number }
  className?: string
}

/**
 * Editorial hero voor de profiel-pagina van een vakman. Grote serif naam
 * (h1), optioneel één italic woord, lead-paragraaf met drop-cap, stats-rij.
 *
 * Past bij `category.jsx`-patroon en de redactionele toon ("Een gids, geen
 * makelaar.").
 */
export function TradespersonHero({
  companyName,
  italicWord,
  subtitle,
  description,
  withDropCap,
  stats,
  rating,
  className,
}: TradespersonHeroProps) {
  return (
    <section className={clsx(styles.hero, className)}>
      <h1 className={clsx('serif', styles.title)}>
        {companyName}
        {italicWord && (
          <>
            {' '}
            <em className={styles.italic}>{italicWord}</em>
          </>
        )}
      </h1>

      {subtitle && <div className={clsx('muted', styles.subtitle)}>{subtitle}</div>}

      {rating && (
        <div className={styles.rating}>
          <Stars rating={rating.rating} reviews={rating.reviews} showNumber size="lg" />
        </div>
      )}

      {description &&
        (withDropCap ? (
          <DropCap className={styles.lede}>{description}</DropCap>
        ) : (
          <p className={styles.lede}>{description}</p>
        ))}

      {stats && stats.length > 0 && (
        <>
          <hr className="rule" />
          <dl className={styles.stats}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <dt className="label label-muted">{stat.label}</dt>
                <dd className={styles.statValue}>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  )
}
