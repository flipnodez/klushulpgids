import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'

/**
 * Stub voor next/link in de Storybook context. Next/link werkt alleen in een
 * Next.js runtime — in Storybook (Vite) renderen we 'm als een gewone <a>.
 * Behavior is functioneel identiek voor visuele preview.
 */

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children?: ReactNode
  prefetch?: boolean
  scroll?: boolean
  replace?: boolean
  shallow?: boolean
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { prefetch, scroll, replace, shallow, ...rest },
  ref,
) {
  return <a ref={ref} {...rest} />
})

export default Link
