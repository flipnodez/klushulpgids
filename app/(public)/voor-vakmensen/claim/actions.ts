'use server'

import { headers } from 'next/headers'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { signIn } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({
  kvk: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'KvK-nummer is altijd 8 cijfers'),
})

export type ClaimResult = { success: string } | { error: string }

export async function claimProfileAction(formData: FormData): Promise<ClaimResult> {
  const parsed = schema.safeParse({ kvk: formData.get('kvk') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ongeldig KvK-nummer' }
  }

  // Rate limit per IP — voorkomt enumeratie van KvK-nummers
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limit = await rateLimit(`claim:ip:${ip}`, 10, 60 * 60)
  if (!limit.allowed) {
    return {
      error: 'Te veel claim-aanvragen vanaf dit netwerk. Probeer het over een uur opnieuw.',
    }
  }

  const tradesperson = await prisma.tradesperson.findUnique({
    where: { kvkNumber: parsed.data.kvk },
    select: {
      id: true,
      companyName: true,
      email: true, // versleuteld
      profileClaimed: true,
    },
  })

  // Generieke melding bij niet-gevonden of al-geclaimd om enumeratie te voorkomen
  const genericNotFound: ClaimResult = {
    error:
      'Geen profiel gevonden voor dit KvK-nummer, of het profiel is al geclaimd. Heeft u problemen? Neem contact op met onze redactie.',
  }

  if (!tradesperson) return genericNotFound
  if (tradesperson.profileClaimed) return genericNotFound
  if (!tradesperson.email) {
    return {
      error:
        'Geen e-mailadres bekend bij dit profiel. Neem contact op met onze redactie zodat wij u kunnen helpen claimen.',
    }
  }

  let plainEmail: string
  try {
    plainEmail = decrypt(tradesperson.email).toLowerCase()
  } catch {
    return {
      error:
        'Wij konden het e-mailadres bij dit profiel niet ontsleutelen. Onze redactie is op de hoogte gesteld.',
    }
  }

  // Verstuur magic-link met claim-callback
  try {
    await signIn('email', {
      email: plainEmail,
      redirectTo: `/dashboard/welkom?claim=${tradesperson.id}`,
      redirect: false,
    })
  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err
    return {
      error: 'Versturen van de inlog-link is mislukt. Probeer het later opnieuw.',
    }
  }

  // Compliance log
  await prisma.complianceLog.create({
    data: {
      eventType: 'CLAIM_REQUEST',
      metadata: { tradespersonId: tradesperson.id, ip, at: new Date().toISOString() },
    },
  })

  // Mask email in feedback (alleen eerste letter + domein)
  const masked = maskEmail(plainEmail)
  return {
    success: `Wij hebben een inlog-link gestuurd naar ${masked}. Klik op de link om uw profiel te claimen — de link is 24 uur geldig.`,
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local[0] ?? '*'
  return `${visible}${'•'.repeat(Math.max(0, local.length - 1))}@${domain}`
}
