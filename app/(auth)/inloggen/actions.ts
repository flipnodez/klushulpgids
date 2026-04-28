'use server'

import { z } from 'zod'

import { signIn } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Voer een geldig e-mailadres in'),
  callbackUrl: z.string().optional(),
})

export type LoginActionResult = { ok: true } | { error: string }

export async function loginAction(formData: FormData): Promise<LoginActionResult> {
  const parsed = schema.safeParse({
    email: formData.get('email'),
    callbackUrl: formData.get('callbackUrl'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ongeldig e-mailadres' }
  }

  // Rate-limit: 3 magic-link requests per uur per email + 5 per 15 min per IP
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const [emailLimit, ipLimit] = await Promise.all([
    rateLimit(`magic-link:email:${parsed.data.email}`, 3, 60 * 60),
    rateLimit(`magic-link:ip:${ip}`, 5, 15 * 60),
  ])

  if (!emailLimit.allowed) {
    return {
      error:
        'U heeft het maximum aantal inlog-links voor dit e-mailadres bereikt. Probeer het over een uur nog eens.',
    }
  }
  if (!ipLimit.allowed) {
    return {
      error: 'Te veel pogingen vanaf dit netwerk. Probeer het over 15 minuten nog eens.',
    }
  }

  try {
    await signIn('email', {
      email: parsed.data.email,
      redirectTo: parsed.data.callbackUrl ?? '/dashboard',
    })
    return { ok: true }
  } catch (err) {
    // NextAuth gooit een redirect-error bij succes — die moet door
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err
    return {
      error: 'Het versturen van de inlog-link is mislukt. Probeer het later opnieuw.',
    }
  }
}
