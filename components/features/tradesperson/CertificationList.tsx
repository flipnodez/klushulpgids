import { clsx } from 'clsx'

import { EmDashLabel } from '../../ui/EmDashLabel'
import { Icon } from '../../ui/Icon'
import styles from './CertificationList.module.css'

type Cert = {
  id: string
  name: string
  description?: string | null
}

type CertificationListProps = {
  items: Cert[]
  /** Inline = comma-separated; list = vertical with shield-icon */
  layout?: 'inline' | 'list'
  className?: string
}

/**
 * Lijst van certificaten/erkenningen. Inline (op cards) of als verticale
 * lijst met shield-icon (op profiel-pagina).
 */
export function CertificationList({ items, layout = 'inline', className }: CertificationListProps) {
  if (items.length === 0) return null

  if (layout === 'inline') {
    return (
      <span className={clsx('muted', 'text-sm', className)}>
        {items.map((c) => c.name).join(' · ')}
      </span>
    )
  }

  return (
    <section className={clsx(styles.block, className)}>
      <EmDashLabel>Certificeringen</EmDashLabel>
      <ul className={styles.list}>
        {items.map((c) => (
          <li key={c.id} className={styles.item}>
            <Icon name="ShieldCheck" size={18} strokeWidth={1.5} className={styles.icon} />
            <div>
              <div className={styles.name}>{c.name}</div>
              {c.description && (
                <div className={clsx('muted', 'text-sm', styles.desc)}>{c.description}</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
