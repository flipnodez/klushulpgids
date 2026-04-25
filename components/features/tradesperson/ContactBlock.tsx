import { clsx } from 'clsx'

import { Button } from '../../ui/Button'
import { EmDashLabel } from '../../ui/EmDashLabel'
import { Icon } from '../../ui/Icon'
import styles from './ContactBlock.module.css'

type ContactBlockProps = {
  phone?: string | null
  email?: string | null
  websiteUrl?: string | null
  className?: string
}

/**
 * Contact-blok voor profielpagina: telefoon (groot, klikbaar), email-knop,
 * website-knop. Telefoonnummer rendert als grote serif — past bij editorial.
 */
export function ContactBlock({ phone, email, websiteUrl, className }: ContactBlockProps) {
  if (!phone && !email && !websiteUrl) return null

  const cleanPhone = phone?.replace(/\s/g, '')

  return (
    <section className={clsx(styles.block, className)}>
      <EmDashLabel>Direct contact</EmDashLabel>

      {phone && (
        <a className={clsx('plain', 'serif', styles.phone)} href={`tel:${cleanPhone}`}>
          <Icon name="Phone" size={20} strokeWidth={1.5} />
          <span>{phone}</span>
        </a>
      )}

      <div className={styles.actions}>
        {email && (
          <Button variant="secondary" size="sm" href={`mailto:${email}`}>
            <Icon name="Mail" size={16} strokeWidth={1.5} />
            E-mailen
          </Button>
        )}
        {websiteUrl && (
          <Button
            variant="secondary"
            size="sm"
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="ArrowRight" size={16} strokeWidth={1.5} />
            Website bezoeken
          </Button>
        )}
      </div>
    </section>
  )
}
