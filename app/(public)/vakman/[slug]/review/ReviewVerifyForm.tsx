'use client'

import { useState, useTransition } from 'react'
import { clsx } from 'clsx'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

import { requestReviewVerificationAction } from './actions'
import styles from '../../../inloggen/page.module.css'

export function ReviewVerifyForm({ slug }: { slug: string }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const fd = new FormData(e.currentTarget)
    fd.set('slug', slug)
    startTransition(async () => {
      const res = await requestReviewVerificationAction(fd)
      if ('error' in res) setError(res.error)
      else setSuccess(res.success)
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
      <label className={styles.label} htmlFor="email">
        Uw e-mailadres
      </label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="naam@voorbeeld.nl"
        disabled={isPending}
      />
      <p className={styles.helper}>
        Wij gebruiken uw e-mailadres alleen om verificatie te sturen. Het wordt niet bij uw review
        gepubliceerd.
      </p>
      {error && <p className={clsx(styles.error)}>{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Versturen…' : 'Stuur verificatielink'}
      </Button>
    </form>
  )
}
