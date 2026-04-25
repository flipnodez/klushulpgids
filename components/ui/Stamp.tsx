import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type StampProps = HTMLAttributes<HTMLSpanElement>

/**
 * Signature element: rode outlined-tekst (1px solid accent, uppercase, 11px,
 * letter-spacing 0.14em). Net een afgestempeld briefhoofd.
 *
 * Voorbeelden uit het design: `✓ Onafhankelijk`, `Ø Lead-fee`.
 *
 * Render zelf het symbool + tekst als `children` — geen icon-prop, want
 * stamps gebruiken bewust unicode-tekens (`✓`, `◆`, `Ø`) ipv lucide icons.
 */
export function Stamp({ className, ...rest }: StampProps) {
  return <span className={clsx('stamp', className)} {...rest} />
}
