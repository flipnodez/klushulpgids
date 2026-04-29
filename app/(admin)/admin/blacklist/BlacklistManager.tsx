'use client'

import { useState, useTransition } from 'react'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

import { addBlacklistAction, removeBlacklistAction } from './actions'
import styles from '../shared.module.css'

type Entry = {
  id: string
  kvkNumber: string | null
  emailHash: string | null
  reason: string | null
  createdAt: string
}

const fmtDate = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function BlacklistManager({ items: initial }: { items: Entry[] }) {
  const [items, setItems] = useState(initial)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await addBlacklistAction(fd)
      if (res.ok) {
        setFeedback({ kind: 'ok', msg: 'Toegevoegd. Refresh om te zien.' })
        ;(e.target as HTMLFormElement).reset()
        // Best to refresh — server already revalidated; we'll just show toast
        location.reload()
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  function remove(id: string, label: string) {
    if (
      !confirm(
        `Verwijder ${label} van de blacklist? Hierna kan dit KvK/email weer worden toegevoegd.`,
      )
    )
      return
    const fd = new FormData()
    fd.set('id', id)
    startTransition(async () => {
      const res = await removeBlacklistAction(fd)
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id))
        setFeedback({ kind: 'ok', msg: 'Verwijderd.' })
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <section>
        <h2 className={styles.h2}>Toevoegen</h2>
        <form className={styles.formBlock} onSubmit={onAdd} noValidate>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <div className={styles.fieldRow} style={{ flex: 1, minWidth: 160 }}>
              <label className={styles.fieldLabel} htmlFor="kvk">
                KvK-nummer
              </label>
              <Input id="kvk" name="kvk" inputMode="numeric" maxLength={8} />
            </div>
            <div className={styles.fieldRow} style={{ flex: 2, minWidth: 220 }}>
              <label className={styles.fieldLabel} htmlFor="email">
                E-mailadres
              </label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className={styles.fieldRow} style={{ flex: 2, minWidth: 240 }}>
              <label className={styles.fieldLabel} htmlFor="reason">
                Reden
              </label>
              <Input
                id="reason"
                name="reason"
                required
                placeholder="bv. handmatig verzoek tot verwijdering"
              />
            </div>
          </div>
          <p className={styles.fieldHelp}>
            Vul KvK óf e-mail in (of beide). Reden is verplicht voor audit-trail.
          </p>
          {feedback && (
            <div className={feedback.kind === 'ok' ? styles.success : styles.error}>
              {feedback.msg}
            </div>
          )}
          <div className={styles.actions}>
            <Button type="submit" disabled={isPending}>
              Toevoegen aan blacklist
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className={styles.h2}>Bestaande entries ({items.length})</h2>
        {items.length === 0 ? (
          <div className={styles.empty}>Blacklist is leeg.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>KvK</th>
                <th>Email-hash</th>
                <th>Reden</th>
                <th>Toegevoegd</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td style={{ fontFamily: 'monospace' }}>{i.kvkNumber ?? '—'}</td>
                  <td>
                    {i.emailHash ? (
                      <code style={{ fontSize: 11 }}>{i.emailHash.slice(0, 16)}…</code>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>{i.reason ?? ''}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {fmtDate.format(new Date(i.createdAt))}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        remove(i.id, i.kvkNumber ?? i.emailHash?.slice(0, 12) ?? 'entry')
                      }
                      disabled={isPending}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--accent)',
                        color: 'var(--accent)',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      Verwijder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
