'use client'

import { useState, useTransition } from 'react'
import { clsx } from 'clsx'

import { Button } from '@/components/ui/Button'

import { confirmUnsubscribeAction } from './actions'
import styles from '../../inloggen/page.module.css'

export function UnsubscribeConfirmForm({ token, id }: { token: string; id: string }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await confirmUnsubscribeAction(fd)
      if ('error' in result) setError(result.error)
      else setSuccess(result.success)
    })
  }

  if (success) {
    return (
      <div className={styles.form}>
        <p className={styles.label}>Verwijderd</p>
        <p>{success}</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="id" value={id} />
      <p className={styles.helper}>
        Hierna is verwijdering definitief en kan niet ongedaan worden gemaakt zonder contact met
        onze redactie binnen 7 dagen.
      </p>
      {error && <p className={clsx(styles.error)}>{error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Bezig…' : 'Definitief verwijderen'}
      </Button>
    </form>
  )
}
