'use server'

import { headers } from 'next/headers'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { decrypt, hashEmail } from '@/lib/encryption'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/lettermint'
import { unsubscribeConfirmTemplate } from '@/lib/email/templates/unsubscribeConfirm'
import { deletionConfirmationTemplate } from '@/lib/email/templates/deletionConfirmation'
import { deleteObject } from '@/lib/storage/objects'

const TOKEN_TTL_HOURS = 24
const TOKEN_PREFIX = 'unsubscribe:'

const requestSchema = z
  .object({
    kvk: z.string().trim().optional().or(z.literal('')),
    email: z.string().trim().toLowerCase().optional().or(z.literal('')),
  })
  .refine((d) => d.kvk || d.email, {
    message: 'Vul een KvK-nummer of e-mailadres in.',
  })

const baseUrl = (process.env.NEXTAUTH_URL ?? 'https://klushulpgids.nl').replace(/\/$/, '')

export type RequestResult = { success: string } | { error: string }
export type ConfirmResult = { success: string } | { error: string }

export async function requestUnsubscribeAction(formData: FormData): Promise<RequestResult> {
  const parsed = requestSchema.safeParse({
    kvk: formData.get('kvk'),
    email: formData.get('email'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ongeldige invoer' }
  }

  // Rate-limit per IP — voorkom enumeration / spam
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limit = await rateLimit(`unsubscribe:ip:${ip}`, 5, 60 * 60)
  if (!limit.allowed) {
    return {
      error: 'Te veel aanvragen vanaf dit netwerk. Probeer het over een uur opnieuw.',
    }
  }

  const kvkNumber = parsed.data.kvk?.replace(/\D/g, '') || undefined
  const emailLower = parsed.data.email || undefined

  let tradesperson: {
    id: string
    companyName: string
    email: string | null
  } | null = null

  if (kvkNumber && /^\d{8}$/.test(kvkNumber)) {
    tradesperson = await prisma.tradesperson.findUnique({
      where: { kvkNumber },
      select: { id: true, companyName: true, email: true },
    })
  }
  if (!tradesperson && emailLower) {
    const hashed = hashEmail(emailLower)
    tradesperson = await prisma.tradesperson.findUnique({
      where: { emailHash: hashed },
      select: { id: true, companyName: true, email: true },
    })
  }

  // Generieke melding bij niet-gevonden — voorkom dat we KvK/email bestaan-status lekken
  const generic: RequestResult = {
    success:
      'Als er een profiel met deze gegevens bestaat, hebben wij een bevestigingslink gestuurd naar het bekende e-mailadres. Klik op de link in die e-mail om de verwijdering definitief te maken.',
  }

  if (!tradesperson || !tradesperson.email) return generic

  let plainEmail: string
  try {
    plainEmail = decrypt(tradesperson.email).toLowerCase()
  } catch {
    return generic
  }

  // Genereer token + opslaan in VerificationToken (zelfde tabel die NextAuth gebruikt)
  const token = randomUUID()
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)

  await prisma.verificationToken.create({
    data: {
      identifier: `${TOKEN_PREFIX}${tradesperson.id}`,
      token,
      expires,
    },
  })

  const url = `${baseUrl}/voor-vakmensen/uitschrijven?token=${encodeURIComponent(token)}&id=${tradesperson.id}`
  const { html, text } = unsubscribeConfirmTemplate({
    companyName: tradesperson.companyName,
    url,
  })
  const sent = await sendEmail({
    to: plainEmail,
    subject: 'Bevestig verwijdering uit Klushulpgids',
    html,
    text,
  })

  await prisma.complianceLog.create({
    data: {
      eventType: 'UNSUBSCRIBE_REQUESTED',
      metadata: {
        tradespersonId: tradesperson.id,
        ip,
        emailSent: sent.ok,
        at: new Date().toISOString(),
      },
    },
  })

  return generic
}

const confirmSchema = z.object({
  token: z.string().min(10).max(200),
  id: z.string().uuid(),
})

export async function confirmUnsubscribeAction(formData: FormData): Promise<ConfirmResult> {
  const parsed = confirmSchema.safeParse({
    token: formData.get('token'),
    id: formData.get('id'),
  })
  if (!parsed.success) return { error: 'Ongeldige link' }

  const expectedIdentifier = `${TOKEN_PREFIX}${parsed.data.id}`
  const stored = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token },
  })

  if (!stored || stored.identifier !== expectedIdentifier) {
    return { error: 'Deze link is ongeldig of al gebruikt.' }
  }
  if (stored.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token: parsed.data.token } }).catch(() => null)
    return { error: 'Deze link is verlopen. Vraag een nieuwe aan.' }
  }

  const tradesperson = await prisma.tradesperson.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      companyName: true,
      email: true,
      kvkNumber: true,
      emailHash: true,
      photos: { select: { storageKey: true } },
    },
  })
  if (!tradesperson) {
    await prisma.verificationToken.delete({ where: { token: parsed.data.token } }).catch(() => null)
    return { error: 'Profiel niet gevonden — mogelijk al verwijderd.' }
  }

  // Best-effort foto-cleanup in storage
  await Promise.all(
    tradesperson.photos
      .filter((p) => !!p.storageKey)
      .map((p) => deleteObject(p.storageKey!).catch(() => undefined)),
  )

  await prisma.$transaction([
    prisma.tradesperson.delete({ where: { id: tradesperson.id } }),
    prisma.optOutBlacklist.upsert({
      where: { kvkNumber: tradesperson.kvkNumber ?? '__no_kvk__' },
      create: {
        kvkNumber: tradesperson.kvkNumber ?? null,
        emailHash: tradesperson.emailHash ?? null,
        reason: 'unsubscribe_email_link',
      },
      update: { reason: 'unsubscribe_email_link' },
    }),
    prisma.verificationToken.delete({ where: { token: parsed.data.token } }),
    prisma.complianceLog.create({
      data: {
        eventType: 'PROFILE_DELETED_VIA_UNSUBSCRIBE',
        metadata: {
          tradespersonId: tradesperson.id,
          companyName: tradesperson.companyName,
          at: new Date().toISOString(),
        },
      },
    }),
  ])

  // Confirmation mail
  if (tradesperson.email) {
    try {
      const plainEmail = decrypt(tradesperson.email)
      const { html, text } = deletionConfirmationTemplate({ companyName: tradesperson.companyName })
      await sendEmail({
        to: plainEmail,
        subject: 'Uw Klushulpgids profiel is verwijderd',
        html,
        text,
      })
    } catch {
      // ignore — kerntaak (verwijderen) is gelukt
    }
  }

  return {
    success: `Het profiel van ${tradesperson.companyName} is verwijderd uit de Klushulpgids. U ontvangt een bevestiging per e-mail.`,
  }
}
