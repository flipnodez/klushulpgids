import type { InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef, useId } from 'react'
import { clsx } from 'clsx'

import { Label } from './Label'
import styles from './Input.module.css'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** Inline label boven het veld (uppercase, 11px, tracked) */
  label?: ReactNode
  /** Helper tekst onder het veld */
  helperText?: ReactNode
  /** Foutmelding (vervangt helperText) */
  errorText?: ReactNode
  /** Niet zichtbaar maar wel een label voor screenreaders */
  visuallyHiddenLabel?: boolean
}

/**
 * Input met **border-bottom only** — geen volledig kader, geen rounded corners.
 * Inline label boven (uppercase, 11px, tracking 0.18em).
 *
 * Focus-state: 2px ink onderlijn (3px in dark mode voor contrast).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    errorText,
    visuallyHiddenLabel,
    className,
    id: idProp,
    'aria-describedby': describedByProp,
    ...rest
  },
  ref,
) {
  const reactId = useId()
  const id = idProp ?? `input-${reactId}`
  const describedById = errorText ? `${id}-err` : helperText ? `${id}-help` : undefined
  const describedBy = [describedByProp, describedById].filter(Boolean).join(' ') || undefined

  return (
    <div className={clsx(styles.wrap, className)}>
      {label && (
        <Label
          as="label"
          htmlFor={id}
          variant="muted"
          className={clsx(styles.label, visuallyHiddenLabel && styles.srOnly)}
        >
          {label}
        </Label>
      )}
      <input
        ref={ref}
        id={id}
        className={clsx(styles.input, errorText && styles.error)}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {errorText && (
        <span id={`${id}-err`} className={styles.errorText}>
          {errorText}
        </span>
      )}
      {!errorText && helperText && (
        <span id={`${id}-help`} className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  )
})
