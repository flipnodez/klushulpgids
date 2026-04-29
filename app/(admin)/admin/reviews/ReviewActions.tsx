'use client'

import { useState, useTransition } from 'react'
import type { ReviewStatus } from '@prisma/client'

import { Button } from '@/components/ui/Button'

import {
  approveReviewAction,
  rejectReviewAction,
  markSpamReviewAction,
  clearReviewFlagAction,
} from './actions'
import styles from '../shared.module.css'

type Props = {
  reviewId: string
  status: ReviewStatus
  flagged: boolean
  tradespersonSlug: string
}

export function ReviewActions({ reviewId, status, flagged }: Props) {
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function run(label: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setFeedback(null)
    startTransition(async () => {
      const res = await action()
      if (res.ok) setFeedback({ kind: 'ok', msg: `${label}` })
      else setFeedback({ kind: 'err', msg: res.error ?? 'Mislukt' })
    })
  }

  function approve() {
    const fd = new FormData()
    fd.set('reviewId', reviewId)
    run('Goedgekeurd', () => approveReviewAction(fd))
  }

  function rejectWithReason() {
    const fd = new FormData()
    fd.set('reviewId', reviewId)
    fd.set('reason', reason)
    run('Afgewezen', () => rejectReviewAction(fd))
    setShowRejectForm(false)
  }

  function spam() {
    if (!confirm('Markeren als spam? E-mail-hash gaat naar blacklist.')) return
    const fd = new FormData()
    fd.set('reviewId', reviewId)
    run('Spam', () => markSpamReviewAction(fd))
  }

  function clearFlag() {
    const fd = new FormData()
    fd.set('reviewId', reviewId)
    run('Flag verwijderd', () => clearReviewFlagAction(fd))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
      {status === 'PENDING' && (
        <>
          <Button onClick={approve} disabled={isPending}>
            ✓ Goedkeuren
          </Button>
          {!showRejectForm ? (
            <button
              type="button"
              onClick={() => setShowRejectForm(true)}
              disabled={isPending}
              className={styles.fieldLabel}
              style={{
                background: 'transparent',
                border: '1px solid var(--rule)',
                padding: '10px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ✗ Afwijzen…
            </button>
          ) : (
            <>
              <textarea
                rows={2}
                placeholder="Reden (optioneel)…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  font: 'inherit',
                  fontSize: 13,
                  padding: 8,
                  border: '1px solid var(--rule)',
                }}
                maxLength={500}
              />
              <Button onClick={rejectWithReason} disabled={isPending}>
                Bevestig afwijzen
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={spam}
            disabled={isPending}
            style={{
              background: 'transparent',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              padding: '10px',
              cursor: 'pointer',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            ⚠ Markeer als spam
          </button>
        </>
      )}

      {status === 'APPROVED' && flagged && (
        <>
          <Button onClick={clearFlag} disabled={isPending}>
            Flag opheffen
          </Button>
          <button
            type="button"
            onClick={spam}
            disabled={isPending}
            style={{
              background: 'transparent',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              padding: '10px',
              cursor: 'pointer',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            ⚠ Markeer als spam
          </button>
        </>
      )}

      {status === 'APPROVED' && !flagged && (
        <span className={`${styles.badge} ${styles.badgeOk}`}>Goedgekeurd</span>
      )}

      {status === 'REJECTED' && <span className={styles.badge}>Afgewezen</span>}

      {feedback && (
        <div
          style={{
            fontSize: 12,
            padding: '6px 8px',
            background: feedback.kind === 'ok' ? '#ecfdf5' : '#fef2f2',
            color: feedback.kind === 'ok' ? '#065f46' : '#991b1b',
          }}
        >
          {feedback.msg}
        </div>
      )}
    </div>
  )
}
