import { clsx } from 'clsx'

import styles from './CityGrid.module.css'

export type CityItem = {
  slug: string
  name: string
  /** Aantal vakmensen */
  count?: number
  /** Optionele provincie subtitle */
  province?: string
  href?: string
}

type CityGridProps = {
  items: CityItem[]
  columns?: 3 | 4 | 5
  /** Toon provincie als subtitle */
  showProvince?: boolean
  className?: string
}

/**
 * Lijst van steden in een raster. Vergelijkbaar met CategoryGrid maar
 * zonder iconen — wel optioneel met provincie als subtitle.
 */
export function CityGrid({ items, columns = 4, showProvince = false, className }: CityGridProps) {
  return (
    <div className={clsx(styles.grid, styles[`cols${columns}`], className)} role="list">
      {items.map((item) => {
        const content = (
          <>
            <div className={clsx('serif', styles.name)}>{item.name}</div>
            <div className={styles.subline}>
              {showProvince && item.province && (
                <span className={clsx('muted', 'text-xs')}>{item.province}</span>
              )}
              {item.count != null && (
                <span className={clsx('muted', 'text-xs', styles.count)}>
                  {new Intl.NumberFormat('nl-NL').format(item.count)} bedrijven
                </span>
              )}
            </div>
          </>
        )
        return item.href ? (
          <a
            key={item.slug}
            role="listitem"
            href={item.href}
            className={clsx('plain', styles.cell)}
          >
            {content}
          </a>
        ) : (
          <div key={item.slug} role="listitem" className={styles.cell}>
            {content}
          </div>
        )
      })}
    </div>
  )
}
