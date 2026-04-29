'use client'

import { useState, useTransition } from 'react'

import { updateUserRoleAction, deleteUserAction } from './actions'
import styles from '../shared.module.css'

type Role = 'ADMIN' | 'EDITOR' | 'TRADESPERSON' | 'CONSUMER'

type UserRow = {
  id: string
  email: string
  role: Role
  tradespersonId: string | null
  lastSignInAt: string | null
  createdAt: string
}

const fmtDate = new Intl.DateTimeFormat('nl-NL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function UserList({ users }: { users: UserRow[] }) {
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function changeRole(userId: string, newRole: Role) {
    setFeedback(null)
    const fd = new FormData()
    fd.set('userId', userId)
    fd.set('role', newRole)
    startTransition(async () => {
      const res = await updateUserRoleAction(fd)
      if (res.ok) {
        setFeedback({ kind: 'ok', msg: `Rol gewijzigd naar ${newRole}.` })
        location.reload()
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  function remove(userId: string, email: string) {
    if (!confirm(`Verwijder gebruiker ${email}? Cascade: sessions worden ook verwijderd.`)) return
    const fd = new FormData()
    fd.set('userId', userId)
    startTransition(async () => {
      const res = await deleteUserAction(fd)
      if (res.ok) {
        setFeedback({ kind: 'ok', msg: 'Verwijderd.' })
        location.reload()
      } else {
        setFeedback({ kind: 'err', msg: res.error })
      }
    })
  }

  return (
    <>
      {feedback && (
        <div
          className={feedback.kind === 'ok' ? styles.success : styles.error}
          style={{ marginBottom: 12 }}
        >
          {feedback.msg}
        </div>
      )}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>E-mail</th>
            <th>Rol</th>
            <th>Tradesperson</th>
            <th>Laatste login</th>
            <th>Aangemaakt</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>
                <select
                  defaultValue={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value as Role)}
                  disabled={isPending}
                  style={{ padding: '4px 8px', border: '1px solid var(--rule)', fontSize: 12 }}
                >
                  <option value="CONSUMER">CONSUMER</option>
                  <option value="TRADESPERSON">TRADESPERSON</option>
                  <option value="EDITOR">EDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td style={{ fontSize: 11, fontFamily: 'monospace' }}>
                {u.tradespersonId ? `${u.tradespersonId.slice(0, 8)}…` : '—'}
              </td>
              <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                {u.lastSignInAt ? fmtDate.format(new Date(u.lastSignInAt)) : '—'}
              </td>
              <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                {fmtDate.format(new Date(u.createdAt))}
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => remove(u.id, u.email)}
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
    </>
  )
}
