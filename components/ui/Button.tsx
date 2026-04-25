import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'link' | 'accent'
type Size = 'sm' | 'md' | 'lg'

type CommonProps = {
  variant?: Variant
  size?: Size
  /** Stretch over de hele beschikbare breedte */
  fullWidth?: boolean
  children: ReactNode
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: never
  }

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string
  }

type ButtonProps = ButtonAsButton | ButtonAsLink

/**
 * Editorial button — scherpe hoeken (radius 2px max), Inter, 14px.
 *
 * Variants:
 *  - `primary`  ink achtergrond, paper tekst — hover: accent
 *  - `secondary` ghost — paper achtergrond, ink border
 *  - `ghost`    transparant met ink tekst, hover underline
 *  - `link`     pure tekst-link met underline
 *  - `accent`   rode accent voor occasional CTA
 *
 * Wanneer `href` is meegegeven, rendert het als `<a>` ipv `<button>`.
 */
export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', fullWidth, className, children, ...rest } = props
  const classes = clsx(
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  )

  if ('href' in rest && rest.href !== undefined) {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <a className={clsx(classes, 'plain')} href={href} {...anchorRest}>
        {children}
      </a>
    )
  }

  const { type, ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button className={classes} type={type ?? 'button'} {...buttonRest}>
      {children}
    </button>
  )
}
