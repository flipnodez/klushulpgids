import { clsx } from 'clsx'

type Association = {
  id: string
  name: string
  url?: string | null
}

type AssociationListProps = {
  items: Association[]
  /** Inline tekst, bijv. in TradespersonCard footer */
  inline?: boolean
  className?: string
}

/**
 * Brancheverenigingen-lijst. Default: "Aangesloten bij Techniek Nederland · BouwGarant".
 *
 * Klein detail dat veel zegt over geloofwaardigheid van een vakman,
 * past dus prominent (maar niet groot) op de profielpagina.
 */
export function AssociationList({ items, inline, className }: AssociationListProps) {
  if (items.length === 0) return null

  const names = items.map((a) => a.name)
  const text = items.length === 1 ? names[0] : names.join(' · ')

  if (inline) {
    return (
      <span className={clsx('muted', 'text-sm', className)}>
        Aangesloten bij <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{text}</span>
      </span>
    )
  }

  return (
    <p className={clsx('text-sm', className)}>
      <span className="muted">Aangesloten bij </span>
      {items.map((a, i) => (
        <span key={a.id}>
          {a.url ? (
            <a href={a.url} target="_blank" rel="noopener noreferrer">
              {a.name}
            </a>
          ) : (
            <strong style={{ fontWeight: 500 }}>{a.name}</strong>
          )}
          {i < items.length - 1 && ' · '}
        </span>
      ))}
    </p>
  )
}
