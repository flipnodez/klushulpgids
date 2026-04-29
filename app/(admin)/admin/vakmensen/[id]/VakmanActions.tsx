'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/Button'

import {
  forceClaimAction,
  verifyKvkAction,
  resendClaimEmailAction,
  deleteVakmanAction,
} from './actions'
import styles from '../../shared.module.css'

type Props = {
  tradespersonId: string
  profileClaimed: boolean
  kvkVerified: boolean
  plainEmail: string | null
  companyName: string
}

export function VakmanActions({
  tradespersonId,
  profileClaimed,
  kvkVerified,
  plainEmail,
  companyName,
}: Props) {
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState('')

  function run(label: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setFeedback(null)
    startTransition(async () => {
      const res = await action()
      if (res.ok) setFeedback({ kind: 'ok', msg: `${label} gelukt.` })
      else setFeedback({ kind: 'err', msg: res.error ?? 'Mislukt' })
    })
  }

  function deleteIfConfirmed() {
    if (confirmDelete !== 'VERWIJDER') {
      setFeedback({ kind: 'err', msg: 'Typ VERWIJDER om te bevestigen.' })
      return
    }
    if (!confirm(`Weet u zeker dat u "${companyName}" definitief wilt verwijderen?`)) return
    startTransition(async () => {
      const res = await deleteVakmanAction(tradespersonId)
      if (res && 'error' in res && res.error) setFeedback({ kind: 'err', msg: res.error })
      // bij succes navigeert de server-action weg via redirect()
    })
  }

  return (
    <div className={styles.formBlock}>
      <div className={styles.actions}>
        {!profileClaimed && (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => run('Force-claim', () => forceClaimAction(tradespersonId))}
          >
            Force claim
          </Button>
        )}
        {!kvkVerified && (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => run('KvK verify', () => verifyKvkAction(tradespersonId))}
          >
            Mark KvK verified
          </Button>
        )}
        <Button
          type="button"
          disabled={isPending || !plainEmail}
          onClick={() => run('Claim-invite resend', () => resendClaimEmailAction(tradespersonId))}
          title={plainEmail ? '' : 'Geen e-mailadres bekend bij dit profiel'}
        >
          Resend claim-invite
        </Button>
      </div>

      {feedback && (
        <div className={feedback.kind === 'ok' ? styles.success : styles.error}>{feedback.msg}</div>
      )}

      <div
        style={{
          marginTop: 'var(--sp-4)',
          padding: 'var(--sp-4)',
          border: '1px solid var(--accent)',
          background: '#fef9f9',
        }}
      >
        <p style={{ margin: '0 0 var(--sp-2)', fontWeight: 700, color: 'var(--accent)' }}>
          Profiel verwijderen (gevarenzone)
        </p>
        <p className={styles.fieldHelp}>
          Cascade delete: reviews, foto&apos;s, photos in Scaleway. KvK + email-hash gaan naar
          OptOutBlacklist. Onomkeerbaar zonder DB-restore.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 'var(--sp-3)', alignItems: 'center' }}>
          <input
            type="text"
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            placeholder="Typ VERWIJDER"
            style={{ padding: '8px 12px', border: '1px solid var(--rule)', flex: 1, maxWidth: 200 }}
          />
          <button
            type="button"
            onClick={deleteIfConfirmed}
            disabled={isPending || confirmDelete !== 'VERWIJDER'}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--accent)',
              background: confirmDelete === 'VERWIJDER' ? 'var(--accent)' : 'transparent',
              color: confirmDelete === 'VERWIJDER' ? '#fff' : 'var(--accent)',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
              cursor: confirmDelete === 'VERWIJDER' ? 'pointer' : 'not-allowed',
            }}
          >
            Definitief verwijderen
          </button>
        </div>
      </div>
    </div>
  )
}
