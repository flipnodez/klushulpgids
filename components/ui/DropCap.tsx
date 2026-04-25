import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type DropCapProps = HTMLAttributes<HTMLParagraphElement>

/**
 * Editorial drop-cap voor body-paragrafen. Eerste letter wordt 68px serif
 * accent-rood, float-left. Werkt via `:first-letter` CSS pseudo-class.
 *
 * Gebruik op de openings-paragraaf van een artikel of secties met body copy.
 */
export function DropCap({ className, ...rest }: DropCapProps) {
  return <p className={clsx('dropcap', className)} {...rest} />
}
