import 'server-only'

import { env } from '@/lib/env'

/**
 * Lettermint client — minimaal HTTP-wrapper rondom de transactional email API.
 *
 * We gebruiken de REST endpoint direct in plaats van de SDK om dependencies
 * laag te houden en SSR-friendly te blijven.
 *
 * Bij ontbrekende `LETTERMINT_API_KEY` valt deze terug op een **stub** die
 * naar `console.log` schrijft — handig voor lokale dev en CI zonder echte
 * email-creds.
 */

const LETTERMINT_ENDPOINT = 'https://api.lettermint.co/v1/send'

export type SendEmailInput = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}

export type SendEmailResult = { ok: true; id?: string } | { ok: false; error: string }

const FROM_DEFAULT = 'Klushulpgids <noreply@klushulpgids.nl>'
const REPLY_TO_DEFAULT = 'support@klushulpgids.nl'

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = env.LETTERMINT_API_KEY

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, error: 'LETTERMINT_API_KEY missing in production' }
    }
    // Dev/test stub: log en doe alsof het lukt
    console.log('[lettermint:stub] would send:', {
      to: input.to,
      subject: input.subject,
      preview: input.text.slice(0, 100),
    })
    return { ok: true, id: 'stub' }
  }

  try {
    const response = await fetch(LETTERMINT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Lettermint gebruikt een eigen header — geen Authorization: Bearer.
        // Bron: lettermint-go SDK email.go (req.Header.Set("x-lettermint-token", ...))
        'X-Lettermint-Token': apiKey,
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL ? env.FROM_EMAIL : FROM_DEFAULT,
        // Lettermint API verwacht arrays voor to / reply_to
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: [input.replyTo ?? REPLY_TO_DEFAULT],
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      return {
        ok: false,
        error: `Lettermint ${response.status}: ${body.slice(0, 200)}`,
      }
    }

    const json = (await response.json().catch(() => null)) as {
      message_id?: string
      status?: string
    } | null
    return { ok: true, id: json?.message_id }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
