'use client'

import { useState, useTransition } from 'react'
import { clsx } from 'clsx'

import { Button } from '@/components/ui/Button'
import { Stars } from '@/components/ui/Stars'

import { respondToReviewAction, flagReviewAction } from '../actions'
import styles from './reviews.module.css'

type Review = {
  id: string
  reviewerName: string
  reviewerCity: string | null
  rating: number
  title: string | null
  body: string
  createdAt: string
  ownerResponse: string | null
  ownerResponseAt: string | null
  flagged: boolean
}

const fmt = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Nog geen reviews. Reviews verschijnen hier zodra een klant er één plaatst.</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {reviews.map((r) => (
        <ReviewItem key={r.id} review={r} />
      ))}
    </div>
  )
}

function ReviewItem({ review }: { review: Review }) {
  const [editing, setEditing] = useState(false)
  const [flagging, setFlagging] = useState(false)
  const [response, setResponse] = useState(review.ownerResponse ?? '')
  const [flagReason, setFlagReason] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function submitResponse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    const fd = new FormData()
    fd.set('reviewId', review.id)
    fd.set('response', response)
    startTransition(async () => {
      const res = await respondToReviewAction(fd)
      if (res.ok) {
        setEditing(false)
        setFeedback({ kind: 'ok', msg: 'Reactie geplaatst.' })
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  function submitFlag(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    const fd = new FormData()
    fd.set('reviewId', review.id)
    fd.set('reason', flagReason)
    startTransition(async () => {
      const res = await flagReviewAction(fd)
      if (res.ok) {
        setFlagging(false)
        setFeedback({ kind: 'ok', msg: 'Melding verstuurd. Onze redactie bekijkt dit.' })
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  return (
    <article className={clsx(styles.review, review.flagged && styles.reviewFlagged)}>
      <header className={styles.head}>
        <Stars rating={review.rating} />
        <div className={styles.meta}>
          <strong>{review.reviewerName}</strong>
          {review.reviewerCity && <span> · {review.reviewerCity}</span>}
          <span> · {fmt.format(new Date(review.createdAt))}</span>
        </div>
      </header>

      {review.title && <h3 className={styles.title}>{review.title}</h3>}
      <p className={styles.body}>{review.body}</p>

      {review.ownerResponse && !editing && (
        <div className={styles.ownerResponse}>
          <p className={styles.ownerLabel}>Uw reactie:</p>
          <p>{review.ownerResponse}</p>
          {review.ownerResponseAt && (
            <p className={styles.ownerDate}>
              Geplaatst op {fmt.format(new Date(review.ownerResponseAt))}
            </p>
          )}
        </div>
      )}

      {editing && (
        <form onSubmit={submitResponse} className={styles.form}>
          <textarea
            rows={4}
            maxLength={500}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Reageer professioneel op deze review…"
            className={styles.textarea}
            required
          />
          <div className={styles.formActions}>
            <Button type="submit" disabled={isPending || response.length < 10}>
              {isPending ? 'Plaatsen…' : 'Reactie plaatsen'}
            </Button>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setEditing(false)}
              disabled={isPending}
            >
              Annuleren
            </button>
          </div>
        </form>
      )}

      {flagging && (
        <form onSubmit={submitFlag} className={styles.form}>
          <textarea
            rows={3}
            maxLength={500}
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Waarom is deze review onterecht? (min 10 tekens)"
            className={styles.textarea}
            required
          />
          <div className={styles.formActions}>
            <Button type="submit" disabled={isPending || flagReason.length < 10}>
              {isPending ? 'Versturen…' : 'Melden'}
            </Button>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setFlagging(false)}
              disabled={isPending}
            >
              Annuleren
            </button>
          </div>
        </form>
      )}

      {feedback && (
        <div className={feedback.kind === 'ok' ? styles.success : styles.error}>{feedback.msg}</div>
      )}

      {!editing && !flagging && (
        <div className={styles.actions}>
          <button type="button" className={styles.linkBtn} onClick={() => setEditing(true)}>
            {review.ownerResponse ? 'Reactie bewerken' : 'Reageren'}
          </button>
          {!review.flagged && (
            <button type="button" className={styles.linkBtn} onClick={() => setFlagging(true)}>
              Onterecht melden
            </button>
          )}
          {review.flagged && <span className={styles.flagged}>Gemeld bij redactie</span>}
        </div>
      )}
    </article>
  )
}
