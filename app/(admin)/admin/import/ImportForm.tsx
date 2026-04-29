'use client'

import { useState, useTransition } from 'react'

import { Button } from '@/components/ui/Button'

import { importVakmenenAction } from './actions'
import styles from '../shared.module.css'

type Result = {
  total: number
  created: number
  updated: number
  skipped: { reason: string; row: string }[]
}

export function ImportForm() {
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResult(null)
    const fd = new FormData(e.currentTarget)
    if (!confirm('Bestand uploaden en records upserten? Dit kan profiel-data overschrijven.')) {
      return
    }
    startTransition(async () => {
      const res = await importVakmenenAction(fd)
      if (res.ok) {
        setResult({
          total: res.total,
          created: res.created,
          updated: res.updated,
          skipped: res.skipped,
        })
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className={styles.formBlock}>
      <form onSubmit={onSubmit}>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel} htmlFor="file">
            JSON-bestand
          </label>
          <input
            id="file"
            type="file"
            name="file"
            accept="application/json,.json"
            required
            disabled={isPending}
            style={{ padding: 8, border: '1px solid var(--rule)', background: '#fff' }}
          />
          <span className={styles.fieldHelp}>Max 10 MB, max 5000 records.</span>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.actions} style={{ marginTop: 16 }}>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Importeren…' : 'Start import'}
          </Button>
        </div>
      </form>

      {result && (
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          <div className={styles.success}>
            <strong>Import voltooid:</strong> {result.created} aangemaakt · {result.updated}{' '}
            geüpdatet · {result.skipped.length} overgeslagen ({result.total} totaal).
          </div>
          {result.skipped.length > 0 && (
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                Toon {result.skipped.length} overgeslagen records
              </summary>
              <table className={styles.table} style={{ marginTop: 12 }}>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Reden</th>
                  </tr>
                </thead>
                <tbody>
                  {result.skipped.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.row}</td>
                      <td style={{ fontSize: 12 }}>{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
