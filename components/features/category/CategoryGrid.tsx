import { clsx } from 'clsx'

import { Icon } from '../../ui/Icon'
import type { IconName } from '../../ui/Icon'
import styles from './CategoryGrid.module.css'

export type CategoryItem = {
  slug: string
  name: string
  /** Aantal vakmensen — niet getoond als undefined */
  count?: number
  iconName: IconName
  href?: string
}

type CategoryGridProps = {
  items: CategoryItem[]
  /** 4 kolommen op desktop (default), 3 voor compactere views */
  columns?: 3 | 4
  className?: string
}

/**
 * Editorial 4-koloms-raster van vakgebieden — conform `home.jsx`.
 * Geen borders tussen cellen, alleen subtiele scheiders rechts + onder.
 * Hover: paper-2 achtergrond.
 */
export function CategoryGrid({ items, columns = 4, className }: CategoryGridProps) {
  return (
    <div className={clsx(styles.grid, columns === 3 && styles.cols3, className)} role="list">
      {items.map((item) => {
        const content = (
          <>
            <Icon name={item.iconName} size={28} strokeWidth={1.4} className={styles.icon} />
            <div className={styles.text}>
              <div className={clsx('serif', styles.name)}>{item.name}</div>
              {item.count != null && (
                <div className={clsx('muted', 'text-xs', styles.count)}>
                  {new Intl.NumberFormat('nl-NL').format(item.count)} bedrijven
                </div>
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
