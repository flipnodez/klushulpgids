import type { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

import styles from './Container.module.css'

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  /** `default` = 1240px max, `wide` = 1440px max (split-views) */
  width?: 'default' | 'wide'
}

/**
 * Layout container — max-width 1240px (of 1440px wide), 48px padding desktop / 24px mobile.
 * Volgt de design-tokens (`--container`, `--container-pad`).
 */
export function Container({ width = 'default', className, ...rest }: ContainerProps) {
  return <div className={clsx(styles.container, styles[width], className)} {...rest} />
}
