'use client'

import { useState, useTransition } from 'react'
import { clsx } from 'clsx'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

import { requestUnsubscribeAction } from './actions'
import styles from '../../inloggen/page.module.css'

export function UnsubscribeRequestForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await requestUnsubscribeAction(fd)
      if ('error' in result) setError(result.error)
      else setSuccess(result.success)
    })
  }

  if (success) {
    return (
      <div className={styles.form}>
        <p className={styles.label}>Verstuurd</p>
        <p>{success}</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.label} htmlFor="kvk">
        KvK-nummer
      </label>
      <Input
        id="kvk"
        name="kvk"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{8}"
        maxLength={8}
        placeholder="12345678"
        disabled={isPending}
      />

      <p className={styles.helper} style={{ textAlign: 'center', margin: '4px 0' }}>
        — of —
      </p>

      <label className={styles.label} htmlFor="email">
        E-mailadres
      </label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="naam@uwbedrijf.nl"
        disabled={isPending}
      />

      <p className={styles.helper}>
        Vul één van beide in. Wij sturen een bevestigingslink naar het bij ons bekende e-mailadres
        van uw bedrijf — uw profiel wordt pas verwijderd nadat u die link aanklikt.
      </p>

      {error && <p className={clsx(styles.error)}>{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Versturen…' : 'Stuur bevestigingslink'}
      </Button>
    </form>
  )
}
