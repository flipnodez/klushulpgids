'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, hashEmail } from '@/lib/encryption'
import { rateLimit } from '@/lib/rate-limit'
import { deleteObject } from '@/lib/storage/objects'
import { sendEmail } from '@/lib/email/lettermint'
import { deletionConfirmationTemplate } from '@/lib/email/templates/deletionConfirmation'

// ── helpers ────────────────────────────────────────────────────────────────

async function requireOwner() {
  const session = await auth()
  if (!session?.user?.tradespersonId) {
    throw new Error('Niet geautoriseerd')
  }
  return {
    userId: session.user.id,
    tradespersonId: session.user.tradespersonId,
    email: session.user.email,
  }
}

function fail(error: string) {
  return { ok: false as const, error }
}

function ok<T extends object = Record<string, never>>(extra?: T) {
  return { ok: true as const, ...(extra ?? {}) }
}

type ActionResult = { ok: true } | { ok: false; error: string }

// ── profielbewerking ───────────────────────────────────────────────────────

const profileSchema = z.object({
  description: z
    .string()
    .trim()
    .min(50, 'Beschrijving is te kort (min 50 tekens)')
    .max(2000, 'Beschrijving is te lang (max 2000 tekens)')
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  websiteUrl: z
    .string()
    .trim()
    .url('Voer een geldige URL in (incl. https://)')
    .optional()
    .or(z.literal('')),
  hourlyRateMin: z.coerce
    .number()
    .int()
    .min(0)
    .max(500)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  hourlyRateMax: z.coerce
    .number()
    .int()
    .min(0)
    .max(500)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  emergencyService: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
})

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const { tradespersonId, userId } = await requireOwner()
  const limit = await rateLimit(`profile:${userId}`, 20, 60 * 60)
  if (!limit.allowed)
    return fail('Te veel wijzigingen in korte tijd. Probeer het over een uur opnieuw.')

  const parsed = profileSchema.safeParse({
    description: formData.get('description'),
    phone: formData.get('phone'),
    websiteUrl: formData.get('websiteUrl'),
    hourlyRateMin: formData.get('hourlyRateMin'),
    hourlyRateMax: formData.get('hourlyRateMax'),
    emergencyService: formData.get('emergencyService'),
  })
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Ongeldige invoer')
  }

  const data = parsed.data
  if (
    data.hourlyRateMin !== undefined &&
    data.hourlyRateMax !== undefined &&
    data.hourlyRateMin > data.hourlyRateMax
  ) {
    return fail('Minimum tarief mag niet hoger zijn dan maximum')
  }

  const tp = await prisma.tradesperson.update({
    where: { id: tradespersonId },
    data: {
      description: data.description || null,
      phone: data.phone || null,
      websiteUrl: data.websiteUrl || null,
      hourlyRateMin: data.hourlyRateMin ?? null,
      hourlyRateMax: data.hourlyRateMax ?? null,
      emergencyService: data.emergencyService,
    },
    select: { slug: true },
  })

  revalidatePath(`/vakman/${tp.slug}`)
  revalidatePath('/dashboard/profiel')
  return ok()
}

// ── beschikbaarheid ────────────────────────────────────────────────────────

const availabilitySchema = z.object({
  status: z.enum([
    'AVAILABLE_NOW',
    'AVAILABLE_THIS_WEEK',
    'AVAILABLE_THIS_MONTH',
    'WAITLIST',
    'NOT_ACCEPTING',
  ]),
})

export async function setAvailabilityAction(formData: FormData): Promise<ActionResult> {
  const { tradespersonId, userId } = await requireOwner()
  const limit = await rateLimit(`availability:${userId}`, 30, 60 * 60)
  if (!limit.allowed) return fail('Te veel wijzigingen.')

  const parsed = availabilitySchema.safeParse({ status: formData.get('status') })
  if (!parsed.success) return fail('Ongeldige status')

  const tp = await prisma.tradesperson.update({
    where: { id: tradespersonId },
    data: {
      availabilityStatus: parsed.data.status,
      availabilityUpdatedAt: new Date(),
    },
    select: { slug: true },
  })

  revalidatePath(`/vakman/${tp.slug}`)
  revalidatePath('/dashboard/beschikbaarheid')
  revalidatePath('/dashboard')
  return ok()
}

// ── reviews ────────────────────────────────────────────────────────────────

const reviewResponseSchema = z.object({
  reviewId: z.string().uuid(),
  response: z.string().trim().min(10).max(500),
})

export async function respondToReviewAction(formData: FormData): Promise<ActionResult> {
  const { tradespersonId, userId } = await requireOwner()
  const limit = await rateLimit(`review-response:${userId}`, 30, 60 * 60)
  if (!limit.allowed) return fail('Te veel reacties in korte tijd.')

  const parsed = reviewResponseSchema.safeParse({
    reviewId: formData.get('reviewId'),
    response: formData.get('response'),
  })
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Ongeldige reactie')

  // Authorization: review moet bij deze tradesperson horen
  const review = await prisma.review.findUnique({
    where: { id: parsed.data.reviewId },
    select: { tradespersonId: true },
  })
  if (!review || review.tradespersonId !== tradespersonId) {
    return fail('Review niet gevonden')
  }

  await prisma.review.update({
    where: { id: parsed.data.reviewId },
    data: {
      ownerResponse: parsed.data.response,
      ownerResponseAt: new Date(),
    },
  })

  const tp = await prisma.tradesperson.findUnique({
    where: { id: tradespersonId },
    select: { slug: true },
  })
  if (tp) revalidatePath(`/vakman/${tp.slug}`)
  revalidatePath('/dashboard/reviews')
  return ok()
}

const flagSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.string().trim().min(10).max(500),
})

export async function flagReviewAction(formData: FormData): Promise<ActionResult> {
  const { tradespersonId } = await requireOwner()

  const parsed = flagSchema.safeParse({
    reviewId: formData.get('reviewId'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Ongeldige melding')

  const review = await prisma.review.findUnique({
    where: { id: parsed.data.reviewId },
    select: { tradespersonId: true },
  })
  if (!review || review.tradespersonId !== tradespersonId) {
    return fail('Review niet gevonden')
  }

  await prisma.review.update({
    where: { id: parsed.data.reviewId },
    data: { flagged: true, flagReason: parsed.data.reason },
  })

  revalidatePath('/dashboard/reviews')
  return ok()
}

// ── instellingen ───────────────────────────────────────────────────────────

const notifySchema = z.object({
  notifyNewReview: z.preprocess((v) => v === 'on' || v === 'true', z.boolean()),
  notifyMonthlyStats: z.preprocess((v) => v === 'on' || v === 'true', z.boolean()),
  notifyAvailabilityReminder: z.preprocess((v) => v === 'on' || v === 'true', z.boolean()),
})

export async function updateNotificationsAction(formData: FormData): Promise<ActionResult> {
  const { userId } = await requireOwner()

  const parsed = notifySchema.safeParse({
    notifyNewReview: formData.get('notifyNewReview'),
    notifyMonthlyStats: formData.get('notifyMonthlyStats'),
    notifyAvailabilityReminder: formData.get('notifyAvailabilityReminder'),
  })
  if (!parsed.success) return fail('Ongeldige instellingen')

  await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
  })

  revalidatePath('/dashboard/instellingen')
  return ok()
}

// ── tijdelijk verbergen ────────────────────────────────────────────────────

const deactivateSchema = z.object({
  active: z.preprocess((v) => v === 'on' || v === 'true', z.boolean()),
})

export async function setProfileActiveAction(formData: FormData): Promise<ActionResult> {
  const { tradespersonId } = await requireOwner()
  const parsed = deactivateSchema.safeParse({ active: formData.get('active') })
  if (!parsed.success) return fail('Ongeldige waarde')

  const tp = await prisma.tradesperson.update({
    where: { id: tradespersonId },
    data: { profileActive: parsed.data.active },
    select: { slug: true },
  })
  revalidatePath(`/vakman/${tp.slug}`)
  revalidatePath('/dashboard/instellingen')
  return ok()
}

// ── GDPR delete ────────────────────────────────────────────────────────────

const deleteConfirmSchema = z.object({
  confirmText: z.literal('VERWIJDER'),
})

export async function deleteProfileAction(formData: FormData): Promise<ActionResult> {
  const { tradespersonId, userId, email } = await requireOwner()

  const parsed = deleteConfirmSchema.safeParse({
    confirmText: formData.get('confirmText'),
  })
  if (!parsed.success) {
    return fail('Typ "VERWIJDER" om te bevestigen.')
  }

  const tp = await prisma.tradesperson.findUnique({
    where: { id: tradespersonId },
    select: {
      companyName: true,
      kvkNumber: true,
      emailHash: true,
      photos: { select: { id: true, storageKey: true } },
    },
  })
  if (!tp) return fail('Profiel niet gevonden')

  // Beste-effort: verwijder foto's uit Scaleway. Failures niet fataal voor delete.
  await Promise.all(
    tp.photos
      .filter((p) => !!p.storageKey)
      .map((p) => deleteObject(p.storageKey!).catch(() => undefined)),
  )

  await prisma.$transaction([
    prisma.tradesperson.delete({ where: { id: tradespersonId } }),
    prisma.optOutBlacklist.upsert({
      where: { kvkNumber: tp.kvkNumber ?? '__no_kvk__' },
      create: {
        kvkNumber: tp.kvkNumber ?? null,
        emailHash: tp.emailHash ?? null,
        reason: 'gdpr_delete',
      },
      update: { reason: 'gdpr_delete' },
    }),
    prisma.user.delete({ where: { id: userId } }).catch(() => null) as never,
    prisma.complianceLog.create({
      data: {
        eventType: 'PROFILE_DELETED',
        metadata: {
          tradespersonId,
          companyName: tp.companyName,
          at: new Date().toISOString(),
        },
      },
    }),
  ])

  if (email) {
    const { html, text } = deletionConfirmationTemplate({ companyName: tp.companyName })
    await sendEmail({
      to: email,
      subject: 'Uw Klushulpgids profiel is verwijderd',
      html,
      text,
    })
  }

  await signOut({ redirect: false })
  redirect('/?deleted=1')
}

// ── email-wijziging (re-encrypt + verificatie) ─────────────────────────────

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export async function updateEmailAction(formData: FormData): Promise<ActionResult> {
  const { tradespersonId } = await requireOwner()
  const parsed = emailSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return fail('Ongeldig e-mailadres')

  const newHash = hashEmail(parsed.data.email)
  // Check uniqueness
  const existing = await prisma.tradesperson.findUnique({
    where: { emailHash: newHash },
    select: { id: true },
  })
  if (existing && existing.id !== tradespersonId) {
    return fail('Dit e-mailadres is al gekoppeld aan een ander profiel.')
  }

  await prisma.tradesperson.update({
    where: { id: tradespersonId },
    data: {
      email: encrypt(parsed.data.email),
      emailHash: newHash,
    },
  })

  // NB: in een volledige implementatie sturen we hier een verificatie-link
  // voordat we de email pas activeren. Voor MVP slaan we direct op.
  return ok()
}
