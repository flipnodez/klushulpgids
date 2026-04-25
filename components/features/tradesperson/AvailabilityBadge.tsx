import { Badge } from '../../ui/Badge'

type AvailabilityStatus =
  | 'AVAILABLE_NOW'
  | 'AVAILABLE_THIS_WEEK'
  | 'AVAILABLE_THIS_MONTH'
  | 'WAITLIST'
  | 'NOT_ACCEPTING'
  | 'UNKNOWN'

type AvailabilityBadgeProps = {
  status: AvailabilityStatus
  /** Toon laatste update als tooltip */
  updatedAt?: Date | string
  className?: string
}

const STATUS_LABEL: Record<AvailabilityStatus, string> = {
  AVAILABLE_NOW: 'Beschikbaar',
  AVAILABLE_THIS_WEEK: 'Deze week beschikbaar',
  AVAILABLE_THIS_MONTH: 'Deze maand beschikbaar',
  WAITLIST: 'Wachtlijst',
  NOT_ACCEPTING: 'Geen nieuwe klussen',
  UNKNOWN: 'Status onbekend',
}

const STATUS_VARIANT: Record<AvailabilityStatus, 'success' | 'accent' | 'muted' | 'default'> = {
  AVAILABLE_NOW: 'success',
  AVAILABLE_THIS_WEEK: 'success',
  AVAILABLE_THIS_MONTH: 'default',
  WAITLIST: 'muted',
  NOT_ACCEPTING: 'muted',
  UNKNOWN: 'muted',
}

function formatUpdated(updatedAt: Date | string): string {
  const date = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Badge die de `Tradesperson.availabilityStatus` enum visueel toont.
 * Groene dot voor beschikbaar, neutrale grijs voor onbekend/niet-accepterend.
 *
 * Tooltip met `updatedAt` zodat bezoekers kunnen zien hoe vers de info is.
 */
export function AvailabilityBadge({ status, updatedAt, className }: AvailabilityBadgeProps) {
  const label = STATUS_LABEL[status]
  const variant = STATUS_VARIANT[status]
  const dot = status === 'AVAILABLE_NOW' || status === 'AVAILABLE_THIS_WEEK'
  const title = updatedAt ? `${label} — laatst bijgewerkt ${formatUpdated(updatedAt)}` : label

  return (
    <Badge variant={variant} dot={dot} className={className} title={title}>
      {label}
    </Badge>
  )
}

export type { AvailabilityStatus }
