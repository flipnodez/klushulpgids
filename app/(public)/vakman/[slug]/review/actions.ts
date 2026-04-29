'use server'

import { headers } from 'next/headers'
import { randomUUID, createHash } from 'node:crypto'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { hashEmail } from '@/lib/encryption'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/lettermint'
import { reviewVerifyTemplate } from '@/lib/email/templates/reviewVerify'
import { reviewReceivedTemplate } from '@/lib/email/templates/reviewReceived'

type RequestResult = { success: string } | { error: string }
type SubmitResult = { success: string } | { error: string }

const TOKEN_TTL_HOURS = 24
const TOKEN_PREFIX = 'review:'
const baseUrl = (process.env.NEXTAUTH_URL ?? 'https://klushulpgids.nl').replace(/\/$/, '')

const requestSchema = z.object({
  slug: z.string().min(1),
  email: z.string().trim().toLowerCase().email('Vul een geldig e-mailadres in'),
})

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

export async function requestReviewVerificationAction(formData: FormData): Promise<RequestResult> {
  const parsed = requestSchema.safeParse({
    slug: formData.get('slug'),
    email: formData.get('email'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ongeldige invoer' }
  }

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  const [emailLimit, ipLimit] = await Promise.all([
    rateLimit(`review-verify:email:${parsed.data.email}`, 3, 60 * 60),
    rateLimit(`review-verify:ip:${ip}`, 5, 15 * 60),
  ])
  if (!emailLimit.allowed) {
    return {
      error: 'Te veel verificatie-aanvragen voor dit e-mailadres. Probeer over een uur opnieuw.',
    }
  }
  if (!ipLimit.allowed) {
    return { error: 'Te veel aanvragen vanaf dit netwerk. Probeer over 15 minuten opnieuw.' }
  }

  const tp = await prisma.tradesperson.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true, companyName: true },
  })
  if (!tp) {
    return { error: 'Profiel niet gevonden' }
  }

  // Email-blacklist check
  const emailHashed = hashEmail(parsed.data.email)
  const blocked = await prisma.optOutBlacklist.findFirst({
    where: { emailHash: emailHashed },
  })
  if (blocked) {
    // Generic success — don't leak which email is blacklisted
    return {
      success: 'Als uw e-mailadres geldig is, hebben wij u een verificatielink gestuurd.',
    }
  }

  // Voorkom dubbele review per email per vakman binnen 90 dagen
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const existing = await prisma.review.findFirst({
    where: {
      tradespersonId: tp.id,
      reviewerEmailHash: emailHashed,
      createdAt: { gte: ninetyDaysAgo },
    },
    select: { id: true },
  })
  if (existing) {
    return {
      error:
        'U heeft recent al een review geplaatst voor dit profiel. Voor een tweede review moet er minimaal 90 dagen tussen zitten.',
    }
  }

  // Genereer token + opslaan in VerificationToken
  const token = randomUUID()
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000)

  // identifier verbindt token aan vakman + email-hash. Dit gebruiken we
  // bij submit om mismatch tussen token en form-payload te detecteren.
  const identifier = `${TOKEN_PREFIX}${tp.id}:${emailHashed}`

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  })

  const url = `${baseUrl}/vakman/${parsed.data.slug}/review?token=${encodeURIComponent(token)}`
  const { html, text } = reviewVerifyTemplate({ companyName: tp.companyName, url })
  const sent = await sendEmail({
    to: parsed.data.email,
    subject: `Schrijf uw review voor ${tp.companyName}`,
    html,
    text,
  })

  await prisma.complianceLog.create({
    data: {
      eventType: 'REVIEW_VERIFY_REQUESTED',
      metadata: {
        tradespersonId: tp.id,
        emailSent: sent.ok,
        ipHash: hashIp(ip),
        at: new Date().toISOString(),
      },
    },
  })

  return {
    success:
      'Wij hebben u een verificatielink gestuurd. Klik op de link in uw inbox om uw review te schrijven (24 uur geldig).',
  }
}

const URL_REGEX = /(https?:\/\/|www\.|@\w+\.)/i

const submitSchema = z.object({
  slug: z.string().min(1),
  token: z.string().min(10).max(200),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(100),
  body: z.string().trim().min(50, 'Schrijf minimaal 50 tekens').max(1000, 'Maximaal 1000 tekens'),
  reviewerName: z.string().trim().min(2).max(80),
  reviewerCity: z.string().trim().max(80).optional().or(z.literal('')),
  jobDate: z.string().trim().max(20).optional().or(z.literal('')),
  honeypot: z.string().optional(), // moet leeg blijven
})

export async function submitReviewAction(formData: FormData): Promise<SubmitResult> {
  const honeypot = (formData.get('website_extra') as string | null) ?? ''
  if (honeypot.length > 0) {
    // Stille succes — bot mag denken dat het werkte
    return { success: 'Bedankt voor uw review!' }
  }

  const parsed = submitSchema.safeParse({
    slug: formData.get('slug'),
    token: formData.get('token'),
    rating: formData.get('rating'),
    title: formData.get('title'),
    body: formData.get('body'),
    reviewerName: formData.get('reviewerName'),
    reviewerCity: formData.get('reviewerCity'),
    jobDate: formData.get('jobDate'),
    honeypot,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ongeldige invoer' }
  }

  // Body-validatie: geen URLs, geen overmatige caps
  if (URL_REGEX.test(parsed.data.body) || URL_REGEX.test(parsed.data.title)) {
    return { error: 'URLs zijn niet toegestaan in reviews.' }
  }
  const upperRatio =
    [...parsed.data.body].filter((c) => c >= 'A' && c <= 'Z').length /
    Math.max(1, parsed.data.body.length)
  if (upperRatio > 0.4) {
    return { error: 'Schrijf alstublieft niet in HOOFDLETTERS.' }
  }

  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const ipHash = hashIp(ip)

  // Rate limit: max 5 reviews per IP per dag
  const ipLimit = await rateLimit(`review-submit:ip:${ip}`, 5, 24 * 60 * 60)
  if (!ipLimit.allowed) {
    return { error: 'Te veel reviews vanaf dit netwerk. Probeer over 24 uur opnieuw.' }
  }

  // Token-validatie
  const stored = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token },
  })
  if (!stored || !stored.identifier.startsWith(TOKEN_PREFIX)) {
    return { error: 'Deze link is ongeldig of al gebruikt.' }
  }
  if (stored.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token: parsed.data.token } }).catch(() => null)
    return { error: 'Deze link is verlopen. Vraag een nieuwe aan.' }
  }

  // identifier = `review:<tradespersonId>:<emailHash>`
  const idParts = stored.identifier.slice(TOKEN_PREFIX.length).split(':')
  const tradespersonIdFromToken = idParts[0]
  const emailHashFromToken = idParts[1]
  if (!tradespersonIdFromToken || !emailHashFromToken) {
    return { error: 'Ongeldige link' }
  }

  const tp = await prisma.tradesperson.findUnique({
    where: { id: tradespersonIdFromToken },
    select: { id: true, slug: true, companyName: true },
  })
  if (!tp || tp.slug !== parsed.data.slug) {
    return { error: 'Profiel niet gevonden' }
  }

  // Get email back from hash → can't, but we have the hash for storage
  await prisma.$transaction([
    prisma.review.create({
      data: {
        tradespersonId: tp.id,
        reviewerName: parsed.data.reviewerName,
        reviewerCity: parsed.data.reviewerCity || null,
        reviewerEmailHash: emailHashFromToken,
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
        jobDate: parsed.data.jobDate || null,
        verificationMethod: 'EMAIL_CONFIRMED',
        status: 'PENDING',
        ipAddressHash: ipHash,
      },
    }),
    prisma.verificationToken.delete({ where: { token: parsed.data.token } }),
    prisma.complianceLog.create({
      data: {
        eventType: 'REVIEW_SUBMITTED',
        metadata: {
          tradespersonId: tp.id,
          companyName: tp.companyName,
          rating: parsed.data.rating,
          ipHash,
          emailHash: emailHashFromToken,
          at: new Date().toISOString(),
        },
      },
    }),
  ])

  // Bevestigingsmail naar reviewer — we hebben de email niet meer plaintext
  // maar kunnen via de identifier niet decrypten. Dus: we sturen alleen als
  // we een email-input hebben (we hebben die niet). Skip voor nu.
  // Wel: notify admin
  // (Admin krijgt signaal via /admin dashboard pending-count, geen extra mail)

  // Confirm naar reviewer: kunnen niet — we hebben emailHash maar geen plaintext.
  // Dat is OK; de reviewer kreeg net de magic-link in zijn mailbox dus die weet
  // dat het werkt. We zouden bij de verificatie-stap het emailadres in een
  // session-cookie kunnen bewaren, maar voor MVP slaan we de bevestiging over.
  void reviewReceivedTemplate

  return {
    success:
      'Bedankt voor uw review! Wij plaatsen hem binnen 48 uur op het publieke profiel na controle door onze redactie.',
  }
}
