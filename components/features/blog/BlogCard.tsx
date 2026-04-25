import { clsx } from 'clsx'

import { Label } from '../../ui/Label'
import styles from './BlogCard.module.css'

type BlogCategory =
  | 'KOSTEN'
  | 'TIPS'
  | 'VERDUURZAMEN'
  | 'REGELGEVING'
  | 'VERHALEN'
  | 'VAKMANNEN'
  | 'HOE_DOE_JE'

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  KOSTEN: 'Kosten',
  TIPS: 'Tips',
  VERDUURZAMEN: 'Verduurzamen',
  REGELGEVING: 'Regelgeving',
  VERHALEN: 'Verhalen',
  VAKMANNEN: 'Vakmannen',
  HOE_DOE_JE: 'Hoe doet u dat?',
}

export type BlogCardData = {
  slug: string
  title: string
  excerpt: string
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  category: BlogCategory
  authorName?: string
  publishedAt?: Date | string | null
  /** Geschatte leestijd in minuten */
  readingMinutes?: number
}

type BlogCardProps = {
  data: BlogCardData
  href?: string
  /** Layout variant: `default` met cover, `compact` zonder cover (kleinere lijst) */
  layout?: 'default' | 'compact'
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

/**
 * Editorial blog-card. Cover-foto (optioneel), categorie-label (uppercase
 * accent), serif H3 titel, excerpt (2 regels, line-clamped), datum + reading
 * time onderaan.
 */
export function BlogCard({ data, href, layout = 'default', className }: BlogCardProps) {
  const { title, excerpt, coverImageUrl, coverImageAlt, category, publishedAt, readingMinutes } =
    data

  const meta = [
    publishedAt && formatDate(publishedAt),
    readingMinutes != null && `${readingMinutes} min lezen`,
  ].filter(Boolean) as string[]

  const inner = (
    <article className={clsx(styles.card, layout === 'compact' && styles.compact)}>
      {layout === 'default' && coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt={coverImageAlt ?? ''}
          className={styles.cover}
          loading="lazy"
        />
      )}
      <div className={styles.body}>
        <Label variant="accent" className={styles.category}>
          {CATEGORY_LABEL[category]}
        </Label>
        <h3 className={clsx('serif', styles.title)}>{title}</h3>
        <p className={styles.excerpt}>{excerpt}</p>
        {meta.length > 0 && (
          <div className={clsx('muted', 'text-sm', styles.meta)}>{meta.join(' · ')}</div>
        )}
      </div>
    </article>
  )

  return href ? (
    <a href={href} className={clsx('plain', styles.link, className)}>
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
  )
}
