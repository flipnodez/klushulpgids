'use client'

import type { FormHTMLAttributes } from 'react'
import { useId, useState } from 'react'
import { clsx } from 'clsx'

import { Icon } from './Icon'
import { Label } from './Label'
import styles from './SearchInput.module.css'

type SearchInputProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  /** Default values */
  initialVak?: string
  initialPlaats?: string
  /** Submit handler — krijgt vak + plaats als string-paar */
  onSearch?: (vak: string, plaats: string) => void
  /** Action attribute voor server-side fallback */
  action?: string
  /** Naam-attributen voor de input fields */
  vakName?: string
  plaatsName?: string
}

/**
 * Twee inputs naast elkaar (vak + plaats) gescheiden door 1px ink-rule,
 * met submit-knop rechts. Inspireer op `home.jsx` `.search-form`.
 */
export function SearchInput({
  initialVak = '',
  initialPlaats = '',
  onSearch,
  action,
  vakName = 'vak',
  plaatsName = 'plaats',
  className,
  ...formRest
}: SearchInputProps) {
  const reactId = useId()
  const vakId = `${reactId}-vak`
  const plaatsId = `${reactId}-plaats`
  const [vak, setVak] = useState(initialVak)
  const [plaats, setPlaats] = useState(initialPlaats)

  return (
    <form
      className={clsx(styles.form, className)}
      action={action}
      method="get"
      onSubmit={(e) => {
        if (onSearch) {
          e.preventDefault()
          onSearch(vak.trim(), plaats.trim())
        }
      }}
      {...formRest}
    >
      <div className={styles.field}>
        <Label as="label" htmlFor={vakId} variant="muted" className={styles.label}>
          Wat zoekt u?
        </Label>
        <input
          id={vakId}
          name={vakName}
          type="text"
          autoComplete="off"
          placeholder="bv. loodgieter, schilder, badkamer"
          className={styles.input}
          value={vak}
          onChange={(e) => setVak(e.target.value)}
        />
      </div>

      <div className={styles.divider} aria-hidden="true" />

      <div className={styles.field}>
        <Label as="label" htmlFor={plaatsId} variant="muted" className={styles.label}>
          Waar?
        </Label>
        <input
          id={plaatsId}
          name={plaatsName}
          type="text"
          autoComplete="off"
          placeholder="Plaatsnaam of postcode"
          className={styles.input}
          value={plaats}
          onChange={(e) => setPlaats(e.target.value)}
        />
      </div>

      <button type="submit" className={styles.submit} aria-label="Zoeken">
        <Icon name="ArrowRight" size={20} strokeWidth={1.5} />
      </button>
    </form>
  )
}
