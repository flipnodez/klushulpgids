'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

import { updateNotificationsAction, setProfileActiveAction, deleteProfileAction } from '../actions'
import styles from '../shared.module.css'

type Props = {
  notifications: {
    notifyNewReview: boolean
    notifyMonthlyStats: boolean
    notifyAvailabilityReminder: boolean
  }
  profileActive: boolean
  companyName: string
}

export function SettingsForms({ notifications, profileActive, companyName }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-7)' }}>
      <NotificationForm initial={notifications} />
      <ProfileVisibilityForm initial={profileActive} />
      <DangerZone companyName={companyName} />
    </div>
  )
}

function NotificationForm({
  initial,
}: {
  initial: {
    notifyNewReview: boolean
    notifyMonthlyStats: boolean
    notifyAvailabilityReminder: boolean
  }
}) {
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateNotificationsAction(fd)
      if (res.ok) setFeedback({ kind: 'ok', msg: 'Voorkeuren opgeslagen.' })
      else setFeedback({ kind: 'err', msg: res.error })
    })
  }

  return (
    <section>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, margin: '0 0 var(--sp-3)' }}>
        E-mail-notificaties
      </h2>
      <form onSubmit={onSubmit} className={styles.formBlock}>
        <Toggle
          name="notifyNewReview"
          label="Nieuwe review"
          helper="Ontvang een mail wanneer een klant een review plaatst."
          defaultChecked={initial.notifyNewReview}
        />
        <Toggle
          name="notifyMonthlyStats"
          label="Maandelijkse statistieken"
          helper="Korte samenvatting van profielweergaven en contact-clicks."
          defaultChecked={initial.notifyMonthlyStats}
        />
        <Toggle
          name="notifyAvailabilityReminder"
          label="Beschikbaarheid-reminder"
          helper="Herinnering elke 14 dagen om uw status bij te werken."
          defaultChecked={initial.notifyAvailabilityReminder}
        />
        {feedback && (
          <div className={feedback.kind === 'ok' ? styles.success : styles.error}>
            {feedback.msg}
          </div>
        )}
        <div className={styles.actions}>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </div>
      </form>
    </section>
  )
}

function ProfileVisibilityForm({ initial }: { initial: boolean }) {
  const [active, setActive] = useState(initial)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = !active
    setActive(next)
    setFeedback(null)
    const fd = new FormData()
    fd.set('active', next ? 'on' : '')
    startTransition(async () => {
      const res = await setProfileActiveAction(fd)
      if (res.ok) {
        setFeedback({
          kind: 'ok',
          msg: next ? 'Profiel is weer zichtbaar.' : 'Profiel is verborgen.',
        })
      } else {
        setActive(!next)
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  return (
    <section>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, margin: '0 0 var(--sp-3)' }}>
        Profiel-zichtbaarheid
      </h2>
      <div className={styles.formBlock}>
        <p style={{ margin: 0 }}>
          {active
            ? 'Uw profiel is zichtbaar in de gids en zoekresultaten.'
            : 'Uw profiel is tijdelijk verborgen — niet zichtbaar in zoekresultaten of op overzichtspagina’s.'}
        </p>
        <p className={styles.fieldHelp}>
          U kunt uw profiel later weer zichtbaar maken zonder gegevensverlies.
        </p>
        {feedback && (
          <div className={feedback.kind === 'ok' ? styles.success : styles.error}>
            {feedback.msg}
          </div>
        )}
        <div className={styles.actions}>
          <Button type="button" onClick={toggle} disabled={isPending}>
            {active ? 'Profiel tijdelijk verbergen' : 'Profiel weer zichtbaar maken'}
          </Button>
        </div>
      </div>
    </section>
  )
}

function DangerZone({ companyName }: { companyName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await deleteProfileAction(fd)
      // bij succes redirect de server-action — als we hier nog zijn was er een error
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <section>
      <h2
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 22,
          margin: '0 0 var(--sp-3)',
          color: 'var(--accent)',
        }}
      >
        Profiel verwijderen
      </h2>
      <div
        className={styles.formBlock}
        style={{ borderColor: 'var(--accent)', background: '#fef9f9' }}
      >
        <p style={{ margin: 0 }}>
          Hiermee verwijdert u permanent het profiel van <strong>{companyName}</strong> uit de
          Klushulpgids. Reviews, foto’s en statistieken worden ook verwijderd.
        </p>
        <p className={styles.fieldHelp}>
          Onder de AVG voegen wij uw KvK-nummer toe aan onze opt-out-lijst zodat uw bedrijf niet
          automatisch opnieuw wordt opgenomen. Bedacht u zich binnen 7 dagen? Mail{' '}
          <a href="mailto:support@klushulpgids.nl">support@klushulpgids.nl</a>.
        </p>

        {!confirming && (
          <div className={styles.actions}>
            <Button type="button" onClick={() => setConfirming(true)}>
              Verwijder mijn profiel
            </Button>
          </div>
        )}

        {confirming && (
          <form onSubmit={onSubmit} className={styles.formBlock} style={{ border: 0, padding: 0 }}>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel} htmlFor="confirmText">
                Typ <strong>VERWIJDER</strong> ter bevestiging
              </label>
              <Input id="confirmText" name="confirmText" required />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.actions}>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Bezig…' : 'Definitief verwijderen'}
              </Button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={isPending}
                style={{
                  background: 'none',
                  border: 0,
                  font: 'inherit',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  fontSize: 12,
                }}
              >
                Annuleren
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

function Toggle({
  name,
  label,
  helper,
  defaultChecked,
}: {
  name: string
  label: string
  helper: string
  defaultChecked: boolean
}) {
  return (
    <label
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 'var(--sp-3)',
        cursor: 'pointer',
      }}
    >
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div className={styles.fieldHelp}>{helper}</div>
      </div>
    </label>
  )
}
