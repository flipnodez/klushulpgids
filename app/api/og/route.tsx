import { ImageResponse } from 'next/og'

export const contentType = 'image/png'

const SIZE = { width: 1200, height: 630 }

const COLORS = {
  bg: '#F7F3EC',
  ink: '#1A1A1A',
  accent: '#B91C1C',
  muted: '#6B6B6B',
  rule: '#1A1A1A',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const vak = searchParams.get('vak')?.trim() || ''
  const stad = searchParams.get('stad')?.trim() || ''
  const title = searchParams.get('title')?.trim() || ''
  const kicker = searchParams.get('kicker')?.trim() || 'Klushulpgids'

  let headline: string
  if (title) {
    headline = title
  } else if (vak && stad) {
    headline = `${vak} in ${stad}`
  } else if (vak) {
    headline = vak
  } else {
    headline = 'De gids voor vakmensen'
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: COLORS.bg,
          flexDirection: 'column',
          padding: '72px 80px',
          justifyContent: 'space-between',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 22,
            color: COLORS.accent,
            textTransform: 'uppercase',
            letterSpacing: 6,
            fontFamily: 'sans-serif',
            fontWeight: 600,
          }}
        >
          <span style={{ display: 'flex', width: 56, height: 2, background: COLORS.accent }} />
          {kicker}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <h1
            style={{
              fontSize: headline.length > 40 ? 76 : 96,
              color: COLORS.ink,
              lineHeight: 1.05,
              margin: 0,
              fontWeight: 700,
              letterSpacing: -1.5,
            }}
          >
            {headline}
          </h1>
          <div
            style={{
              fontSize: 28,
              color: COLORS.muted,
              fontFamily: 'sans-serif',
              maxWidth: 900,
              lineHeight: 1.3,
            }}
          >
            De onafhankelijke gids voor Nederlandse vakmensen
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 20,
            color: COLORS.muted,
            fontFamily: 'sans-serif',
            borderTop: `1px solid ${COLORS.rule}`,
            paddingTop: 24,
          }}
        >
          <span style={{ color: COLORS.ink, fontWeight: 600 }}>klushulpgids.nl</span>
          <span>Geen lead-fee · KvK-geverifieerd · Onafhankelijk</span>
        </div>
      </div>
    ),
    SIZE,
  )
}
