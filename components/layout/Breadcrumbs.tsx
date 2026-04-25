import { clsx } from 'clsx'
import { Fragment } from 'react'

import styles from './Breadcrumbs.module.css'

export type BreadcrumbItem = {
  label: string
  /** Geen href = current page (laatste item) */
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  /** Origin voor de absolute URLs in JSON-LD; default `https://klushulpgids.nl` */
  origin?: string
  className?: string
}

/**
 * Editorial breadcrumb: `Home / Vakgebieden / Loodgieters`. Slashes als
 * scheider, laatste item is huidige pagina (ink, geen link).
 *
 * Embedt automatisch [BreadcrumbList JSON-LD](https://schema.org/BreadcrumbList)
 * voor SEO. De JSON-LD is `aria-hidden` zodat screenreaders niet dubbel lezen.
 */
export function Breadcrumbs({
  items,
  origin = 'https://klushulpgids.nl',
  className,
}: BreadcrumbsProps) {
  if (items.length === 0) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href && {
        item: item.href.startsWith('http') ? item.href : `${origin}${item.href}`,
      }),
    })),
  }

  return (
    <>
      <nav className={clsx(styles.wrap, className)} aria-label="Kruimelpad">
        <ol className={styles.list}>
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <Fragment key={`${i}-${item.label}`}>
                <li className={clsx(styles.item, isLast && styles.current)}>
                  {item.href && !isLast ? (
                    <a href={item.href} className="plain">
                      {item.label}
                    </a>
                  ) : (
                    <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
                  )}
                </li>
                {!isLast && (
                  <li className={styles.sep} aria-hidden="true">
                    /
                  </li>
                )}
              </Fragment>
            )
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
