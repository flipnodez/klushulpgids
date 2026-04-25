import { clsx } from 'clsx'

import { Card } from '../../ui/Card'
import { Stars } from '../../ui/Stars'
import type { AvailabilityStatus } from './AvailabilityBadge'
import { AvailabilityBadge } from './AvailabilityBadge'
import styles from './TradespersonCard.module.css'

type Tier = 'FREE' | 'PRO' | 'PREMIUM' | 'ENTERPRISE'

export type TradespersonCardData = {
  slug: string
  companyName: string
  cityName?: string | null
  tradeName?: string | null
  foundedYear?: number | null
  ratingAvg?: number | null
  ratingCount?: number | null
  googleRating?: number | null
  googleReviewsCount?: number | null
  specialties?: string[]
  availabilityStatus?: AvailabilityStatus
  availabilityUpdatedAt?: string | Date | null
  phone?: string | null
  tier?: Tier
}

type TradespersonCardProps = {
  data: TradespersonCardData
  /** Render als link rondom de hele card */
  href?: string
  className?: string
}

/**
 * Editorial listing-card voor een vakman. Inspireer op `category.jsx`:
 * 1px border, geen rounded corners, hover = paper-2 achtergrond.
 *
 * Layout (desktop):
 *   ┌─────────────────────────────────────────────┐
 *   │ Bedrijfsnaam (serif)         [● Beschikbaar]│
 *   │ Stad · Vakgebied · Sinds 2004               │
 *   │ ★★★★★ 4.7 (143)                            │
 *   │ Lekkages · CV-ketels · Riolering            │
 *   │            ─────────                        │
 *   │ 030 - 234 56 78        Bekijk profiel →    │
 *   └─────────────────────────────────────────────┘
 *
 * `data-tier` attribuut voorbereid voor fase 8 (premium-styling).
 */
export function TradespersonCard({ data, href, className }: TradespersonCardProps) {
  const {
    companyName,
    cityName,
    tradeName,
    foundedYear,
    ratingAvg,
    ratingCount,
    googleRating,
    googleReviewsCount,
    specialties = [],
    availabilityStatus,
    availabilityUpdatedAt,
    phone,
    tier = 'FREE',
  } = data

  // Display rating: prefer eigen reviews, fall back op Google
  const displayRating = ratingAvg ?? googleRating
  const displayCount = ratingAvg != null ? ratingCount : googleReviewsCount

  const meta = [cityName, tradeName, foundedYear ? `Sinds ${foundedYear}` : null].filter(
    Boolean,
  ) as string[]

  const content = (
    <Card variant="entry" padding="md" className={styles.card} data-tier={tier}>
      <div className={styles.head}>
        <h3 className={clsx('serif', styles.name)}>{companyName}</h3>
        {availabilityStatus && availabilityStatus !== 'UNKNOWN' && (
          <AvailabilityBadge
            status={availabilityStatus}
            updatedAt={availabilityUpdatedAt ?? undefined}
            className={styles.availability}
          />
        )}
      </div>

      {meta.length > 0 && (
        <div className={clsx('muted', 'text-sm', styles.meta)}>{meta.join(' · ')}</div>
      )}

      {displayRating != null && (
        <div className={styles.rating}>
          <Stars rating={displayRating} reviews={displayCount ?? undefined} showNumber />
        </div>
      )}

      {specialties.length > 0 && (
        <div className={clsx('muted', 'text-sm', styles.specialties)}>
          {specialties.slice(0, 4).join(' · ')}
        </div>
      )}

      {(phone || href) && (
        <>
          <hr className="rule-soft" style={{ margin: '12px 0' }} />
          <div className={styles.foot}>
            {phone ? (
              <a href={`tel:${phone.replace(/\s/g, '')}`} className={clsx('plain', styles.phone)}>
                {phone}
              </a>
            ) : (
              <span />
            )}
            {href && (
              <span className={styles.cta} aria-hidden="true">
                Bekijk profiel →
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  )

  if (href) {
    return (
      <a href={href} className={clsx('plain', styles.link, className)}>
        {content}
      </a>
    )
  }

  return <div className={className}>{content}</div>
}
