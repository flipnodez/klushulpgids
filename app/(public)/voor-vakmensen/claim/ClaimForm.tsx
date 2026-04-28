'use client'

import { useState, useTransition } from 'react'
import { clsx } from 'clsx'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

import { claimProfileAction } from './actions'
import styles from '../../inloggen/page.module.css'

export function ClaimForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await claimProfileAction(fd)
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
        required
        disabled={isPending}
      />
      <p className={styles.helper}>Acht cijfers, te vinden op uw KvK-uittreksel of factuur.</p>
      {error && <p className={clsx(styles.error)}>{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Versturen…' : 'Stuur inlog-link'}
      </Button>
    </form>
  )
}
