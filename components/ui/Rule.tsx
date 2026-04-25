import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type RuleProps = Omit<HTMLAttributes<HTMLHRElement>, 'children'> & {
  /** Visual weight: `default` 1px ink, `thick` 3px ink (krant-stijl), `soft` 1px subtle */
  variant?: 'default' | 'thick' | 'soft'
}

/**
 * Horizontale rule — kernelement van het editorial systeem. Gebruik liever
 * een rule dan een box om secties te scheiden.
 *
 * Voor het signature em-dash-label-prefix patroon (`────  Hoofdartikel`),
 * gebruik {@link EmDashLabel}.
 */
export function Rule({ variant = 'default', className, ...rest }: RuleProps) {
  return (
    <hr
      className={clsx(
        variant === 'default' && 'rule',
        variant === 'thick' && 'rule-thick',
        variant === 'soft' && 'rule-soft',
        className,
      )}
      {...rest}
    />
  )
}
