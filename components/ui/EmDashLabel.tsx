import type { ElementType, HTMLAttributes, ReactNode } from 'react'

import { Label } from './Label'

type EmDashLabelProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  children: ReactNode
  variant?: 'default' | 'muted' | 'accent'
  as?: ElementType
}

/**
 * Signature pattern: `────  Hoofdartikel`
 *
 * Vier em-dashes (—) als prefix op een uppercase label. Dit is hét
 * editorial visuele anker van Klushulpgids — gebruik 'm boven secties,
 * lijsten, en kop-rubrieken.
 *
 * De em-dashes zijn `aria-hidden` zodat screenreaders alleen de label-tekst
 * voorlezen.
 */
export function EmDashLabel({ children, ...rest }: EmDashLabelProps) {
  return (
    <Label {...rest}>
      <span aria-hidden="true">{'————'}</span>
      {'  '}
      {children}
    </Label>
  )
}
