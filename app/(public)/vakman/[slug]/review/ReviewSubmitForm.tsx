'use client'

import { useState, useTransition } from 'react'
import { clsx } from 'clsx'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

import { submitReviewAction } from './actions'
import styles from '../../../inloggen/page.module.css'

export function ReviewSubmitForm({
  slug,
  token,
  companyName,
}: {
  slug: string
  token: string
  companyName: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [bodyLen, setBodyLen] = useState<number>(0)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (rating < 1) {
      setError('Geef een ster-rating (1 t/m 5)')
      return
    }
    const fd = new FormData(e.currentTarget)
    fd.set('slug', slug)
    fd.set('token', token)
    fd.set('rating', String(rating))
    startTransition(async () => {
      const res = await submitReviewAction(fd)
      if ('error' in res) setError(res.error)
      else setSuccess(res.success)
    })
  }

  if (success) {
    return (
      <div className={styles.form}>
        <p className={styles.label}>Bedankt</p>
        <p>{success}</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="token" value={token} />

      {/* Honeypot — verborgen voor mensen, bots vullen 'm in */}
      <div style={{ position: 'absolute', left: '-9999px', top: 'auto' }} aria-hidden="true">
        <label>
          Vul niets in
          <input
            type="text"
            name="website_extra"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </label>
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className={styles.label}>Ster-rating</legend>
        <div style={{ display: 'flex', gap: 6, fontSize: 32 }} role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} ster${n === 1 ? '' : 'ren'}`}
              aria-checked={rating === n}
              role="radio"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: n <= rating ? 'var(--accent)' : '#d4d4d4',
                padding: 0,
                lineHeight: 1,
              }}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <label className={styles.label} htmlFor="title">
        Titel
      </label>
      <Input
        id="title"
        name="title"
        type="text"
        required
        maxLength={100}
        minLength={3}
        placeholder="Korte samenvatting van uw ervaring"
      />

      <label className={styles.label} htmlFor="body">
        Uw review
      </label>
      <textarea
        id="body"
        name="body"
        rows={6}
        required
        minLength={50}
        maxLength={1000}
        onChange={(e) => setBodyLen(e.target.value.length)}
        placeholder={`Beschrijf uw ervaring met ${companyName}: wat hebben ze gedaan, hoe verliep het contact, wat zou u anderen vertellen?`}
        style={{
          font: 'inherit',
          padding: '12px 14px',
          border: '1px solid var(--rule)',
          background: '#fff',
          resize: 'vertical',
        }}
      />
      <p className={styles.helper}>
        {bodyLen}/1000 tekens · minimaal 50 · geen URLs of HOOFDLETTERS
      </p>

      <label className={styles.label} htmlFor="reviewerName">
        Uw naam (publiek zichtbaar)
      </label>
      <Input
        id="reviewerName"
        name="reviewerName"
        type="text"
        required
        minLength={2}
        maxLength={80}
        placeholder="Voornaam en eventueel eerste letter achternaam"
      />

      <label className={styles.label} htmlFor="reviewerCity">
        Uw plaats (optioneel)
      </label>
      <Input
        id="reviewerCity"
        name="reviewerCity"
        type="text"
        maxLength={80}
        placeholder="bv. Amsterdam"
      />

      <label className={styles.label} htmlFor="jobDate">
        Wanneer was de klus? (optioneel)
      </label>
      <Input id="jobDate" name="jobDate" type="text" maxLength={20} placeholder="bv. mei 2026" />

      {error && <p className={clsx(styles.error)}>{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Versturen…' : 'Verstuur review'}
      </Button>
      <p className={styles.helper}>
        Reviews worden door onze redactie binnen 48 uur gecontroleerd voor plaatsing.
      </p>
    </form>
  )
}
