'use client'

import { useState, useTransition, useRef } from 'react'
import { clsx } from 'clsx'

import {
  uploadPhotoAction,
  deletePhotoAction,
  setCoverPhotoAction,
  updatePhotoAltAction,
} from './actions'
import styles from './photos.module.css'

type Photo = {
  id: string
  url: string
  altText: string | null
  isCover: boolean
  displayOrder: number
  width: number | null
  height: number | null
}

export function PhotoManager({ photos: initial }: { photos: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initial)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    setFeedback(null)
    startTransition(async () => {
      for (const file of Array.from(files)) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setFeedback({ kind: 'err', msg: `${file.name}: alleen JPG, PNG of WebP` })
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          setFeedback({ kind: 'err', msg: `${file.name}: groter dan 5 MB` })
          continue
        }

        const fd = new FormData()
        fd.set('file', file)
        const res = await uploadPhotoAction(fd)
        if (res.ok && res.photo) {
          setPhotos((prev) => [...prev, res.photo!])
          setFeedback({ kind: 'ok', msg: `${file.name} geüpload.` })
        } else if (!res.ok) {
          setFeedback({ kind: 'err', msg: res.error })
        }
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Foto verwijderen?')) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('photoId', id)
      const res = await deletePhotoAction(fd)
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id))
        setFeedback({ kind: 'ok', msg: 'Foto verwijderd.' })
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  function handleSetCover(id: string) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('photoId', id)
      const res = await setCoverPhotoAction(fd)
      if (res.ok) {
        setPhotos((prev) => prev.map((p) => ({ ...p, isCover: p.id === id })))
        setFeedback({ kind: 'ok', msg: 'Cover-foto bijgewerkt.' })
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  function handleAltSave(id: string, altText: string) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('photoId', id)
      fd.set('altText', altText)
      const res = await updatePhotoAltAction(fd)
      if (res.ok) {
        setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, altText } : p)))
        setFeedback({ kind: 'ok', msg: 'Alt-tekst opgeslagen.' })
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  return (
    <div className={styles.wrap}>
      <div
        className={styles.dropzone}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
        }}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className={styles.dropTitle}>Sleep foto’s hierheen of klik om te uploaden</p>
        <p className={styles.dropHelper}>JPG, PNG, WebP — max 5 MB per foto</p>
      </div>

      {feedback && (
        <div className={feedback.kind === 'ok' ? styles.success : styles.error}>{feedback.msg}</div>
      )}

      <div className={styles.grid}>
        {photos.length === 0 && (
          <p className={styles.empty}>Nog geen foto’s — voeg uw eerste toe.</p>
        )}
        {photos.map((p) => (
          <div key={p.id} className={clsx(styles.card, p.isCover && styles.cardCover)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.altText ?? ''} className={styles.thumb} />
            <div className={styles.cardBody}>
              <input
                type="text"
                className={styles.altInput}
                placeholder="Beschrijving (alt-tekst)…"
                defaultValue={p.altText ?? ''}
                onBlur={(e) => {
                  if (e.target.value !== (p.altText ?? '')) {
                    handleAltSave(p.id, e.target.value)
                  }
                }}
                maxLength={120}
              />
              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.linkBtn}
                  disabled={isPending || p.isCover}
                  onClick={() => handleSetCover(p.id)}
                >
                  {p.isCover ? '✓ Cover' : 'Maak cover'}
                </button>
                <button
                  type="button"
                  className={styles.linkBtnDanger}
                  disabled={isPending}
                  onClick={() => handleDelete(p.id)}
                >
                  Verwijderen
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isPending && <p className={styles.pending}>Bezig…</p>}
    </div>
  )
}
