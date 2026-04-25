import { clsx } from 'clsx'

import { Stars } from '../../ui/Stars'
import styles from './ReviewCard.module.css'

export type ReviewData = {
  id: string
  reviewerName: string
  reviewerCity?: string | null
  rating: number
  title?: string | null
  body: string
  jobDate?: string | null
  /** Optionele datum (string of Date) voor weergave */
  createdAt?: Date | string
  /** Eigenaar-reactie */
  ownerResponse?: string | null
  ownerResponseAt?: Date | string | null
  /** Bedrijfsnaam voor de "Reactie {x}" prefix */
  companyName?: string
  /** EMAIL_CONFIRMED / KVK_VERIFIED / UNVERIFIED — toont badge */
  verificationMethod?: 'EMAIL_CONFIRMED' | 'KVK_VERIFIED' | 'UNVERIFIED'
}

type ReviewCardProps = {
  review: ReviewData
  className?: string
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const VERIFICATION_LABEL: Record<NonNullable<ReviewData['verificationMethod']>, string | null> = {
  EMAIL_CONFIRMED: 'E-mail bevestigd',
  KVK_VERIFIED: 'KvK-geverifieerd',
  UNVERIFIED: null,
}

/**
 * Editorial review-card. Reviewer naam (serif), stad+datum, sterren, optionele
 * title (h4) en body. Owner-response wordt indented + italic gerenderd met
 * "Reactie {bedrijfsnaam}" prefix.
 */
export function ReviewCard({ review, className }: ReviewCardProps) {
  const {
    reviewerName,
    reviewerCity,
    rating,
    title,
    body,
    jobDate,
    createdAt,
    ownerResponse,
    ownerResponseAt,
    companyName,
    verificationMethod,
  } = review

  const verificationLabel = verificationMethod ? VERIFICATION_LABEL[verificationMethod] : null
  const meta = [
    reviewerCity,
    createdAt && formatDate(createdAt),
    jobDate && `Klus: ${jobDate}`,
  ].filter(Boolean) as string[]

  return (
    <article className={clsx(styles.card, className)}>
      <header className={styles.head}>
        <div>
          <div className={clsx('serif', styles.author)}>{reviewerName}</div>
          {meta.length > 0 && <div className={clsx('muted', 'text-sm')}>{meta.join(' · ')}</div>}
        </div>
        <Stars rating={rating} size="sm" />
      </header>

      {verificationLabel && (
        <div className={clsx('label', 'label-muted', styles.verify)}>{verificationLabel}</div>
      )}

      {title && <h4 className={styles.title}>{title}</h4>}

      <p className={styles.body}>{body}</p>

      {ownerResponse && companyName && (
        <div className={styles.response}>
          <div className={clsx('label', 'label-accent', styles.responseLabel)}>
            Reactie {companyName}
            {ownerResponseAt && ` · ${formatDate(ownerResponseAt)}`}
          </div>
          <p className={styles.responseBody}>{ownerResponse}</p>
        </div>
      )}
    </article>
  )
}
