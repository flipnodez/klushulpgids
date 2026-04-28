'use client'

import { useState, useTransition } from 'react'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

import { updateProfileAction } from '../actions'
import styles from '../shared.module.css'

type Initial = {
  companyName: string
  kvkNumber: string | null
  kvkVerified: boolean
  description: string | null
  phone: string | null
  websiteUrl: string | null
  hourlyRateMin: number | null
  hourlyRateMax: number | null
  emergencyService: boolean
}

export function ProfileForm({ initial }: { initial: Initial }) {
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateProfileAction(fd)
      if (res.ok) setFeedback({ kind: 'ok', msg: 'Profiel opgeslagen.' })
      else setFeedback({ kind: 'err', msg: res.error })
    })
  }

  return (
    <form className={styles.formBlock} onSubmit={onSubmit} noValidate>
      <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>Bedrijfsnaam</span>
        <Input value={initial.companyName} readOnly disabled />
        <span className={styles.fieldHelp}>
          Bedrijfsnaam is gekoppeld aan KvK-registratie. Voor een wijziging: mail
          support@klushulpgids.nl met uw KvK-uittreksel.
        </span>
      </div>

      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel} htmlFor="description">
          Beschrijving
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          maxLength={2000}
          defaultValue={initial.description ?? ''}
          placeholder="Beschrijf uw bedrijf, specialismen en wat klanten van u kunnen verwachten…"
          style={{
            font: 'inherit',
            padding: '12px 14px',
            border: '1px solid var(--rule)',
            background: '#fff',
            resize: 'vertical',
          }}
        />
        <span className={styles.fieldHelp}>
          50–2000 tekens. Wordt zichtbaar op uw publieke profiel.
        </span>
      </div>

      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel} htmlFor="phone">
          Telefoonnummer
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={initial.phone ?? ''}
          placeholder="020 123 4567"
        />
      </div>

      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel} htmlFor="websiteUrl">
          Website
        </label>
        <Input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          defaultValue={initial.websiteUrl ?? ''}
          placeholder="https://uwbedrijf.nl"
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
        <div className={styles.fieldRow} style={{ flex: 1 }}>
          <label className={styles.fieldLabel} htmlFor="hourlyRateMin">
            Tarief min (€/uur)
          </label>
          <Input
            id="hourlyRateMin"
            name="hourlyRateMin"
            type="number"
            min={0}
            max={500}
            defaultValue={initial.hourlyRateMin ?? ''}
          />
        </div>
        <div className={styles.fieldRow} style={{ flex: 1 }}>
          <label className={styles.fieldLabel} htmlFor="hourlyRateMax">
            Tarief max (€/uur)
          </label>
          <Input
            id="hourlyRateMax"
            name="hourlyRateMax"
            type="number"
            min={0}
            max={500}
            defaultValue={initial.hourlyRateMax ?? ''}
          />
        </div>
      </div>

      <div className={styles.fieldRow}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-2)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            name="emergencyService"
            defaultChecked={initial.emergencyService}
          />
          <span>Beschikbaar voor spoeddienst (24/7)</span>
        </label>
      </div>

      {feedback && (
        <div className={feedback.kind === 'ok' ? styles.success : styles.error}>{feedback.msg}</div>
      )}

      <div className={styles.actions}>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Opslaan…' : 'Opslaan'}
        </Button>
      </div>
    </form>
  )
}
