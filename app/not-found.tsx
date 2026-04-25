import Link from 'next/link'

import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'

export default function NotFound() {
  return (
    <Container>
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 'var(--sp-5)',
          maxWidth: 720,
          padding: 'var(--sp-12) 0',
        }}
      >
        <EmDashLabel variant="accent">Niet gevonden</EmDashLabel>
        <h1
          className="serif"
          style={{
            fontSize: 'clamp(40px, 6vw, 64px)',
            fontWeight: 500,
            letterSpacing: '-0.028em',
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Deze pagina staat niet in de{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>gids</em>.
        </h1>
        <p
          className="serif"
          style={{
            fontSize: 'var(--fs-lead)',
            lineHeight: 'var(--lh-lead)',
            color: 'var(--ink-2)',
            maxWidth: '60ch',
          }}
        >
          De URL bestaat niet (meer) of is mogelijk verplaatst. Probeer een van de volgende:
        </p>

        <Rule variant="soft" />

        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-3)',
          }}
        >
          <li>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-serif-fallback)',
                fontSize: 19,
                color: 'var(--ink)',
              }}
            >
              → Naar de homepage
            </Link>
          </li>
          <li>
            <Link
              href="/vakgebieden"
              style={{
                fontFamily: 'var(--font-serif-fallback)',
                fontSize: 19,
                color: 'var(--ink)',
              }}
            >
              → Bekijk alle vakgebieden
            </Link>
          </li>
          <li>
            <Link
              href="/steden"
              style={{
                fontFamily: 'var(--font-serif-fallback)',
                fontSize: 19,
                color: 'var(--ink)',
              }}
            >
              → Bekijk alle steden
            </Link>
          </li>
          <li>
            <Link
              href="/zoeken"
              style={{
                fontFamily: 'var(--font-serif-fallback)',
                fontSize: 19,
                color: 'var(--ink)',
              }}
            >
              → Zoek in de gids
            </Link>
          </li>
        </ul>
      </div>
    </Container>
  )
}
