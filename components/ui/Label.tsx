import type { ElementType, HTMLAttributes, LabelHTMLAttributes } from 'react'
import { clsx } from 'clsx'

/**
 * Label-component is polymorf via `as`. Standaard `<span>`, vaak ook `<label>`
 * (met `htmlFor`) of `<div>`. We accepteren both HTML- en label-attributen
 * zodat htmlFor werkt zonder per-instance casts.
 */
type LabelProps = HTMLAttributes<HTMLElement> &
  Pick<LabelHTMLAttributes<HTMLLabelElement>, 'htmlFor'> & {
    variant?: 'default' | 'muted' | 'accent'
    /** Render als een ander element (default `span`) */
    as?: ElementType
  }

/**
 * Editorial label — uppercase, Inter, 11px, letter-spacing 0.18em.
 * Gebruikt voor metadata, rubrieken en kleine labels.
 */
export function Label({ variant = 'default', as: As = 'span', className, ...rest }: LabelProps) {
  return (
    <As
      className={clsx(
        'label',
        variant === 'muted' && 'label-muted',
        variant === 'accent' && 'label-accent',
        className,
      )}
      {...rest}
    />
  )
}
