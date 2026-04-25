'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log voor server-side monitoring (Scalingo logs / Sentry in fase 8)
    console.error('Public route error:', error)
  }, [error])

  return (
    <Container>
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 'var(--sp-4)',
          maxWidth: 720,
          padding: 'var(--sp-12) 0',
        }}
      >
        <EmDashLabel variant="accent">Er ging iets mis</EmDashLabel>
        <h1
          className="serif"
          style={{
            fontSize: 'clamp(36px, 5vw, 48px)',
            fontWeight: 500,
            letterSpacing: '-0.028em',
            margin: 0,
          }}
        >
          De pagina kon niet geladen worden.
        </h1>
        <p
          className="serif"
          style={{
            fontSize: 'var(--fs-lead)',
            color: 'var(--ink-2)',
            lineHeight: 'var(--lh-lead)',
          }}
        >
          Wij hebben de fout genoteerd. Probeert u het opnieuw, of ga terug naar de homepage.
        </p>
        {error.digest && (
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            Foutcode: <code>{error.digest}</code>
          </p>
        )}
        <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
          <button
            type="button"
            onClick={reset}
            style={{
              background: 'var(--ink)',
              color: 'var(--paper)',
              border: '1px solid var(--ink)',
              padding: 'var(--sp-3) var(--sp-5)',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: 'var(--radius)',
            }}
          >
            Opnieuw proberen
          </button>
          <Link
            href="/"
            style={{
              padding: 'var(--sp-3) var(--sp-5)',
              fontSize: 'var(--fs-sm)',
              color: 'var(--ink)',
              textDecoration: 'underline',
              alignSelf: 'center',
            }}
          >
            Terug naar home
          </Link>
        </div>
      </div>
    </Container>
  )
}
