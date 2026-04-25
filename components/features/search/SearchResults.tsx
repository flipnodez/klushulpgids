import { clsx } from 'clsx'

import { EmDashLabel } from '../../ui/EmDashLabel'
import { TradespersonCard } from '../tradesperson/TradespersonCard'
import type { TradespersonCardData } from '../tradesperson/TradespersonCard'
import styles from './SearchResults.module.css'

export type SortOption = 'quality' | 'rating' | 'distance' | 'recent'

type SearchResultsProps = {
  /** Lijst van vakmensen om te tonen */
  results: TradespersonCardData[]
  /** Totaal aantal (voor "X resultaten" tekst); default = results.length */
  totalCount?: number
  /** Huidige sort */
  sort?: SortOption
  onSortChange?: (sort: SortOption) => void
  /** "Toon meer"-knop callback (server-action of client) */
  onLoadMore?: () => void
  hasMore?: boolean
  /** Empty state */
  emptyMessage?: string
  className?: string
}

const SORT_LABELS: Record<SortOption, string> = {
  quality: 'Kwaliteit',
  rating: 'Beoordeling',
  distance: 'Afstand',
  recent: 'Recent toegevoegd',
}

/**
 * Container voor zoekresultaten — sort-controls bovenaan, lijst van
 * TradespersonCards, optionele "Toon meer"-paginering.
 *
 * Filter-sidebar wordt **niet** in deze component gerenderd — die komt
 * apart in fase 4 omdat 'ie URL-state nodig heeft (Next.js searchParams).
 */
export function SearchResults({
  results,
  totalCount,
  sort = 'quality',
  onSortChange,
  onLoadMore,
  hasMore,
  emptyMessage = 'Geen vakmensen gevonden voor deze zoekopdracht.',
  className,
}: SearchResultsProps) {
  const total = totalCount ?? results.length

  return (
    <section className={clsx(styles.section, className)}>
      <header className={styles.head}>
        <EmDashLabel variant="muted">{total} resultaten</EmDashLabel>
        {onSortChange && (
          <label className={styles.sort}>
            <span className="label label-muted">Sorteer:</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className={styles.select}
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <option key={opt} value={opt}>
                  {SORT_LABELS[opt]}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {results.length === 0 ? (
        <p className={clsx('muted', styles.empty)}>{emptyMessage}</p>
      ) : (
        <ul className={styles.list}>
          {results.map((tp) => (
            <li key={tp.slug}>
              <TradespersonCard data={tp} href={`/${tp.slug}`} />
            </li>
          ))}
        </ul>
      )}

      {hasMore && onLoadMore && (
        <div className={styles.more}>
          <button type="button" className={styles.moreBtn} onClick={onLoadMore}>
            Toon meer resultaten
          </button>
        </div>
      )}
    </section>
  )
}
