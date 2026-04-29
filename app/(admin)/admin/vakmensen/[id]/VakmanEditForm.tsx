'use client'

import { useState, useTransition } from 'react'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

import { updateVakmanAction } from './actions'
import styles from '../../shared.module.css'

type Initial = {
  companyName: string
  description: string | null
  phone: string | null
  websiteUrl: string | null
  hourlyRateMin: number | null
  hourlyRateMax: number | null
  emergencyService: boolean
  qualityScore: number
  tier: 'FREE' | 'PRO' | 'PREMIUM' | 'ENTERPRISE'
  featured: boolean
  profileActive: boolean
}

export function VakmanEditForm({
  tradespersonId,
  initial,
}: {
  tradespersonId: string
  initial: Initial
}) {
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateVakmanAction(tradespersonId, fd)
      if (res.ok) setFeedback({ kind: 'ok', msg: 'Opgeslagen.' })
      else setFeedback({ kind: 'err', msg: res.error })
    })
  }

  return (
    <form className={styles.formBlock} onSubmit={onSubmit} noValidate>
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
          style={{
            font: 'inherit',
            padding: '12px 14px',
            border: '1px solid var(--rule)',
            background: '#fff',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <div className={styles.fieldRow} style={{ flex: 1, minWidth: 200 }}>
          <label className={styles.fieldLabel} htmlFor="phone">
            Telefoon
          </label>
          <Input id="phone" name="phone" type="tel" defaultValue={initial.phone ?? ''} />
        </div>
        <div className={styles.fieldRow} style={{ flex: 2, minWidth: 240 }}>
          <label className={styles.fieldLabel} htmlFor="websiteUrl">
            Website
          </label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            defaultValue={initial.websiteUrl ?? ''}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <div className={styles.fieldRow} style={{ flex: 1, minWidth: 120 }}>
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
        <div className={styles.fieldRow} style={{ flex: 1, minWidth: 120 }}>
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
        <div className={styles.fieldRow} style={{ flex: 1, minWidth: 120 }}>
          <label className={styles.fieldLabel} htmlFor="qualityScore">
            Quality score
          </label>
          <Input
            id="qualityScore"
            name="qualityScore"
            type="number"
            min={0}
            max={100}
            defaultValue={initial.qualityScore}
          />
        </div>
        <div className={styles.fieldRow} style={{ flex: 1, minWidth: 140 }}>
          <label className={styles.fieldLabel} htmlFor="tier">
            Tier
          </label>
          <select
            id="tier"
            name="tier"
            defaultValue={initial.tier}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--rule)',
              background: '#fff',
              font: 'inherit',
            }}
          >
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="PREMIUM">Premium</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-5)', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            name="emergencyService"
            defaultChecked={initial.emergencyService}
          />
          <span>Spoeddienst</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" name="featured" defaultChecked={initial.featured} />
          <span>Featured</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" name="profileActive" defaultChecked={initial.profileActive} />
          <span>Profiel zichtbaar</span>
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
