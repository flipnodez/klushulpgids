'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

import {
  createBlogPostAction,
  updateBlogPostAction,
  deleteBlogPostAction,
  publishBlogPostAction,
  unpublishBlogPostAction,
  uploadCoverImageAction,
} from './actions'
import styles from '../shared.module.css'

type Trade = { id: string; nameSingular: string }
type City = { id: string; name: string }

type Initial = {
  id: string | null
  slug: string
  title: string
  metaDescription: string
  excerpt: string
  body: string
  coverImageUrl: string | null
  coverImageAlt: string | null
  authorName: string
  category:
    | 'KOSTEN'
    | 'TIPS'
    | 'VERDUURZAMEN'
    | 'REGELGEVING'
    | 'VERHALEN'
    | 'VAKMANNEN'
    | 'HOE_DOE_JE'
  relatedTradeId: string | null
  relatedCityId: string | null
  faqItems: { question: string; answer: string }[]
  howToSteps: { name: string; text: string }[]
  publishedAt: string | null
}

export function BlogEditor({
  initial,
  trades,
  cities,
}: {
  initial: Initial
  trades: Trade[]
  cities: City[]
}) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [coverUrl, setCoverUrl] = useState(initial.coverImageUrl ?? '')
  const [coverAlt, setCoverAlt] = useState(initial.coverImageAlt ?? '')
  const [body, setBody] = useState(initial.body)
  const [faqs, setFaqs] = useState(initial.faqItems)
  const [steps, setSteps] = useState(initial.howToSteps)
  const [isPending, startTransition] = useTransition()
  const [isUploading, startUpload] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    const fd = new FormData(e.currentTarget)
    fd.set('faqJson', JSON.stringify(faqs))
    fd.set('howToJson', JSON.stringify(steps))
    fd.set('coverImageUrl', coverUrl)
    fd.set('coverImageAlt', coverAlt)
    fd.set('body', body)

    startTransition(async () => {
      const action = initial.id
        ? () => updateBlogPostAction(initial.id!, fd)
        : () => createBlogPostAction(fd)
      const res = await action()
      if (res.ok) {
        setFeedback({ kind: 'ok', msg: 'Opgeslagen.' })
        if (!initial.id && res.id) {
          router.push(`/admin/blog/${res.id}`)
        } else {
          router.refresh()
        }
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  function onCoverUpload(file: File) {
    const fd = new FormData()
    fd.set('file', file)
    startUpload(async () => {
      const res = await uploadCoverImageAction(fd)
      if (res.ok) {
        setCoverUrl(res.url)
        setFeedback({ kind: 'ok', msg: 'Cover-image geüpload.' })
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  function publish() {
    if (!initial.id) return
    const fd = new FormData()
    fd.set('postId', initial.id)
    startTransition(async () => {
      const res = await publishBlogPostAction(fd)
      if (res.ok) {
        setFeedback({ kind: 'ok', msg: 'Gepubliceerd.' })
        router.refresh()
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  function unpublish() {
    if (!initial.id) return
    const fd = new FormData()
    fd.set('postId', initial.id)
    startTransition(async () => {
      const res = await unpublishBlogPostAction(fd)
      if (res.ok) {
        setFeedback({ kind: 'ok', msg: 'Teruggezet naar concept.' })
        router.refresh()
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  function remove() {
    if (!initial.id) return
    if (!confirm('Post definitief verwijderen?')) return
    const fd = new FormData()
    fd.set('postId', initial.id)
    startTransition(async () => {
      const res = await deleteBlogPostAction(fd)
      if (res && 'error' in res && res.error) {
        setFeedback({ kind: 'err', msg: res.error })
      }
      // bij succes redirect server-action automatisch
    })
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 'var(--sp-5)' }}>
      <div className={styles.formBlock}>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel} htmlFor="title">
            Titel
          </label>
          <Input id="title" name="title" defaultValue={initial.title} required maxLength={200} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <div className={styles.fieldRow} style={{ flex: 2, minWidth: 220 }}>
            <label className={styles.fieldLabel} htmlFor="slug">
              Slug
            </label>
            <Input
              id="slug"
              name="slug"
              defaultValue={initial.slug}
              required
              pattern="[a-z0-9-]+"
              maxLength={100}
            />
            <span className={styles.fieldHelp}>
              Wordt /blog/<strong>slug</strong>. Alleen kleine letters, cijfers, streepjes.
            </span>
          </div>
          <div className={styles.fieldRow} style={{ flex: 1, minWidth: 160 }}>
            <label className={styles.fieldLabel} htmlFor="category">
              Categorie
            </label>
            <select
              id="category"
              name="category"
              defaultValue={initial.category}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--rule)',
                background: '#fff',
                font: 'inherit',
              }}
            >
              <option value="KOSTEN">Kosten</option>
              <option value="TIPS">Tips</option>
              <option value="VERDUURZAMEN">Verduurzamen</option>
              <option value="REGELGEVING">Regelgeving</option>
              <option value="VERHALEN">Verhalen</option>
              <option value="VAKMANNEN">Vakmannen</option>
              <option value="HOE_DOE_JE">Hoe doe je dat?</option>
            </select>
          </div>
        </div>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel} htmlFor="authorName">
            Auteur
          </label>
          <Input
            id="authorName"
            name="authorName"
            defaultValue={initial.authorName}
            required
            maxLength={120}
          />
        </div>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel} htmlFor="metaDescription">
            Meta description (SEO, max 200 chars)
          </label>
          <textarea
            id="metaDescription"
            name="metaDescription"
            defaultValue={initial.metaDescription}
            required
            rows={2}
            maxLength={200}
            style={{ font: 'inherit', padding: 12, border: '1px solid var(--rule)' }}
          />
        </div>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel} htmlFor="excerpt">
            Excerpt (in lijst-views, max 400 chars)
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            defaultValue={initial.excerpt}
            required
            rows={3}
            maxLength={400}
            style={{ font: 'inherit', padding: 12, border: '1px solid var(--rule)' }}
          />
        </div>
      </div>

      <div className={styles.formBlock}>
        <h3 className={styles.h2} style={{ fontSize: 18, margin: 0 }}>
          Cover image
        </h3>
        <div className={styles.fieldRow}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onCoverUpload(f)
            }}
            disabled={isUploading}
          />
          {isUploading && <span className={styles.fieldHelp}>Uploaden…</span>}
        </div>
        {coverUrl && (
          <div style={{ display: 'grid', gap: 'var(--sp-3)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={coverAlt}
              style={{ maxWidth: 360, border: '1px solid var(--rule)' }}
            />
            <Input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…"
            />
            <Input
              type="text"
              value={coverAlt}
              onChange={(e) => setCoverAlt(e.target.value)}
              placeholder="Alt-tekst (toegankelijkheid)"
              maxLength={200}
            />
          </div>
        )}
      </div>

      <div className={styles.formBlock}>
        <h3 className={styles.h2} style={{ fontSize: 18, margin: 0 }}>
          Body (markdown)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={20}
            style={{
              font: '14px ui-monospace, SFMono-Regular, Menlo, monospace',
              padding: 12,
              border: '1px solid var(--rule)',
              minHeight: 400,
            }}
          />
          <div
            style={{
              padding: 12,
              border: '1px solid var(--rule)',
              background: '#fff',
              fontFamily: 'Georgia, serif',
              fontSize: 15,
              lineHeight: 1.6,
              overflow: 'auto',
              maxHeight: 600,
            }}
          >
            {/* eenvoudige markdown-preview: lege regels = paragrafen */}
            {body.split(/\n\n+/).map((para, i) => (
              <p key={i} style={{ margin: '0 0 12px' }}>
                {para}
              </p>
            ))}
          </div>
        </div>
        <span className={styles.fieldHelp}>
          Markdown wordt gerenderd op de publieke pagina via react-markdown + remark-gfm. Live
          preview hier is een ruwe paragraaf-versie.
        </span>
      </div>

      <div className={styles.formBlock}>
        <h3 className={styles.h2} style={{ fontSize: 18, margin: 0 }}>
          Gerelateerde data (voor sidebars + JSON-LD)
        </h3>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <div className={styles.fieldRow} style={{ flex: 1, minWidth: 200 }}>
            <label className={styles.fieldLabel}>Gerelateerd vakgebied</label>
            <select
              name="relatedTradeId"
              defaultValue={initial.relatedTradeId ?? ''}
              style={{ padding: 10, border: '1px solid var(--rule)', font: 'inherit' }}
            >
              <option value="">— geen —</option>
              {trades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameSingular}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.fieldRow} style={{ flex: 1, minWidth: 200 }}>
            <label className={styles.fieldLabel}>Gerelateerde stad</label>
            <select
              name="relatedCityId"
              defaultValue={initial.relatedCityId ?? ''}
              style={{ padding: 10, border: '1px solid var(--rule)', font: 'inherit' }}
            >
              <option value="">— geen —</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.formBlock}>
        <h3 className={styles.h2} style={{ fontSize: 18, margin: 0 }}>
          FAQ items (voor FAQPage schema)
        </h3>
        <FaqRepeater items={faqs} setItems={setFaqs} />
      </div>

      <div className={styles.formBlock}>
        <h3 className={styles.h2} style={{ fontSize: 18, margin: 0 }}>
          HowTo stappen (voor HowTo schema)
        </h3>
        <HowToRepeater items={steps} setItems={setSteps} />
      </div>

      {feedback && (
        <div className={feedback.kind === 'ok' ? styles.success : styles.error}>{feedback.msg}</div>
      )}

      <div
        className={styles.actions}
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'var(--paper)',
          padding: 'var(--sp-3) 0',
          borderTop: '1px solid var(--rule)',
        }}
      >
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Opslaan…' : initial.id ? 'Opslaan' : 'Aanmaken'}
        </Button>
        {initial.id && (
          <>
            {initial.publishedAt ? (
              <Button type="button" onClick={unpublish} disabled={isPending}>
                Terugzetten naar concept
              </Button>
            ) : (
              <Button type="button" onClick={publish} disabled={isPending}>
                Publiceren
              </Button>
            )}
            <a
              href={`/blog/${initial.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: 'var(--ink-2)', textDecoration: 'underline' }}
            >
              Preview ↗
            </a>
            <span style={{ flex: 1 }} />
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              style={{
                background: 'transparent',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Verwijder
            </button>
          </>
        )}
      </div>
    </form>
  )
}

function FaqRepeater({
  items,
  setItems,
}: {
  items: { question: string; answer: string }[]
  setItems: (i: { question: string; answer: string }[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 'var(--sp-3)' }}>
      {items.map((it, idx) => (
        <div
          key={idx}
          style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid var(--rule-soft)' }}
        >
          <Input
            value={it.question}
            onChange={(e) => {
              const next = [...items]
              next[idx] = { ...it, question: e.target.value }
              setItems(next)
            }}
            placeholder="Vraag"
            maxLength={200}
          />
          <textarea
            value={it.answer}
            onChange={(e) => {
              const next = [...items]
              next[idx] = { ...it, answer: e.target.value }
              setItems(next)
            }}
            rows={3}
            placeholder="Antwoord"
            style={{ font: 'inherit', padding: 8, border: '1px solid var(--rule)' }}
            maxLength={1000}
          />
          <button
            type="button"
            onClick={() => setItems(items.filter((_, i) => i !== idx))}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Verwijder
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { question: '', answer: '' }])}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 16px',
          border: '1px solid var(--ink)',
          background: '#fff',
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 1,
          cursor: 'pointer',
        }}
      >
        + FAQ-item toevoegen
      </button>
    </div>
  )
}

function HowToRepeater({
  items,
  setItems,
}: {
  items: { name: string; text: string }[]
  setItems: (i: { name: string; text: string }[]) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 'var(--sp-3)' }}>
      {items.map((it, idx) => (
        <div
          key={idx}
          style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid var(--rule-soft)' }}
        >
          <Input
            value={it.name}
            onChange={(e) => {
              const next = [...items]
              next[idx] = { ...it, name: e.target.value }
              setItems(next)
            }}
            placeholder={`Stap ${idx + 1}: titel`}
            maxLength={200}
          />
          <textarea
            value={it.text}
            onChange={(e) => {
              const next = [...items]
              next[idx] = { ...it, text: e.target.value }
              setItems(next)
            }}
            rows={3}
            placeholder="Beschrijving van de stap"
            style={{ font: 'inherit', padding: 8, border: '1px solid var(--rule)' }}
            maxLength={1000}
          />
          <button
            type="button"
            onClick={() => setItems(items.filter((_, i) => i !== idx))}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Verwijder
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { name: '', text: '' }])}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 16px',
          border: '1px solid var(--ink)',
          background: '#fff',
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: 1,
          cursor: 'pointer',
        }}
      >
        + Stap toevoegen
      </button>
    </div>
  )
}
