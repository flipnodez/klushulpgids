'use client'

import { useState, useTransition } from 'react'
import { clsx } from 'clsx'

import { setAvailabilityAction } from '../actions'
import styles from './picker.module.css'

type Status =
  | 'AVAILABLE_NOW'
  | 'AVAILABLE_THIS_WEEK'
  | 'AVAILABLE_THIS_MONTH'
  | 'WAITLIST'
  | 'NOT_ACCEPTING'
  | 'UNKNOWN'

type SettableStatus = Exclude<Status, 'UNKNOWN'>

const OPTIONS: { value: SettableStatus; label: string; helper: string }[] = [
  { value: 'AVAILABLE_NOW', label: 'Beschikbaar nu', helper: 'Kan deze week starten' },
  { value: 'AVAILABLE_THIS_WEEK', label: 'Deze week', helper: 'Beschikbaar binnen 7 dagen' },
  { value: 'AVAILABLE_THIS_MONTH', label: 'Deze maand', helper: 'Beschikbaar binnen 30 dagen' },
  { value: 'WAITLIST', label: 'Wachtlijst', helper: 'Plek op de wachtlijst' },
  { value: 'NOT_ACCEPTING', label: 'Niet beschikbaar', helper: 'Geen nieuwe klussen' },
]

function formatRelative(iso: string | null): string {
  if (!iso) return 'nog niet ingesteld'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'vandaag bijgewerkt'
  if (days === 1) return 'gisteren bijgewerkt'
  return `${days} dagen geleden bijgewerkt`
}

export function AvailabilityPicker({
  current,
  updatedAt,
}: {
  current: Status
  updatedAt: string | null
}) {
  const [selected, setSelected] = useState<Status>(current)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function pick(value: SettableStatus) {
    if (value === selected || isPending) return
    setSelected(value)
    setFeedback(null)
    const fd = new FormData()
    fd.set('status', value)
    startTransition(async () => {
      const res = await setAvailabilityAction(fd)
      if (res.ok) setFeedback({ kind: 'ok', msg: 'Status bijgewerkt.' })
      else {
        setSelected(current)
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  return (
    <div>
      <div className={styles.grid}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={clsx(styles.option, selected === opt.value && styles.selected)}
            disabled={isPending}
            onClick={() => pick(opt.value)}
            aria-pressed={selected === opt.value}
          >
            <span className={styles.optionLabel}>{opt.label}</span>
            <span className={styles.optionHelper}>{opt.helper}</span>
          </button>
        ))}
      </div>

      <p className={styles.meta}>
        {isPending ? 'Opslaan…' : `Laatst ${formatRelative(updatedAt)}.`}
      </p>

      {feedback && (
        <div className={feedback.kind === 'ok' ? styles.success : styles.error}>{feedback.msg}</div>
      )}
    </div>
  )
}
