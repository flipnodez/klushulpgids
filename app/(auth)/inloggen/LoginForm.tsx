'use client'

import { useState, useTransition } from 'react'
import { clsx } from 'clsx'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

import { loginAction } from './actions'
import styles from './page.module.css'

type Props = {
  callbackUrl?: string
  initialEmail?: string
}

export function LoginForm({ callbackUrl, initialEmail }: Props) {
  const [email, setEmail] = useState(initialEmail ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await loginAction(fd)
      if (result && 'error' in result) {
        setError(result.error)
      }
    })
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? '/dashboard'} />
      <label className={styles.label} htmlFor="email">
        E-mailadres
      </label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="naam@uwbedrijf.nl"
        disabled={isPending}
      />
      {error && <p className={clsx(styles.error)}>{error}</p>}
      <Button type="submit" disabled={isPending || email.length < 4}>
        {isPending ? 'Versturen…' : 'Stuur magic link'}
      </Button>
      <p className={styles.helper}>
        Bij eerste login wordt automatisch een account aangemaakt op het door u opgegeven
        e-mailadres.
      </p>
    </form>
  )
}
