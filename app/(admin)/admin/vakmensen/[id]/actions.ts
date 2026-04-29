'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email/lettermint'
import { claimInviteTemplate } from '@/lib/email/templates/claimInvite'
import { decrypt } from '@/lib/encryption'
import { deleteObject } from '@/lib/storage/objects'
import { logAdminAction, requireAdminRole } from '@/lib/admin/audit'

type Result = { ok: true } | { ok: false; error: string }

const updateSchema = z.object({
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  websiteUrl: z.string().trim().url().optional().or(z.literal('')),
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
  qualityScore: z.coerce.number().int().min(0).max(100),
  tier: z.enum(['FREE', 'PRO', 'PREMIUM', 'ENTERPRISE']),
  featured: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
  profileActive: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
})

export async function updateVakmanAction(
  tradespersonId: string,
  formData: FormData,
): Promise<Result> {
  await requireAdminRole(['ADMIN', 'EDITOR'])

  const parsed = updateSchema.safeParse({
    description: formData.get('description'),
    phone: formData.get('phone'),
    websiteUrl: formData.get('websiteUrl'),
    hourlyRateMin: formData.get('hourlyRateMin'),
    hourlyRateMax: formData.get('hourlyRateMax'),
    emergencyService: formData.get('emergencyService'),
    qualityScore: formData.get('qualityScore'),
    tier: formData.get('tier'),
    featured: formData.get('featured'),
    profileActive: formData.get('profileActive'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ongeldig' }

  const data = parsed.data
  const tp = await prisma.tradesperson.update({
    where: { id: tradespersonId },
    data: {
      description: data.description || null,
      phone: data.phone || null,
      websiteUrl: data.websiteUrl || null,
      hourlyRateMin: data.hourlyRateMin ?? null,
      hourlyRateMax: data.hourlyRateMax ?? null,
      emergencyService: data.emergencyService,
      qualityScore: data.qualityScore,
      tier: data.tier,
      featured: data.featured,
      profileActive: data.profileActive,
    },
    select: { slug: true, companyName: true },
  })

  await logAdminAction('VAKMAN_EDIT', {
    tradespersonId,
    companyName: tp.companyName,
    fields: Object.keys(data),
  })

  revalidatePath(`/vakman/${tp.slug}`)
  revalidatePath(`/admin/vakmensen/${tradespersonId}`)
  revalidatePath('/admin/vakmensen')
  return { ok: true }
}

export async function forceClaimAction(tradespersonId: string): Promise<Result> {
  await requireAdminRole(['ADMIN'])

  const tp = await prisma.tradesperson.findUnique({
    where: { id: tradespersonId },
    select: { id: true, profileClaimed: true, slug: true, companyName: true },
  })
  if (!tp) return { ok: false, error: 'Niet gevonden' }
  if (tp.profileClaimed) return { ok: false, error: 'Al geclaimd' }

  await prisma.tradesperson.update({
    where: { id: tradespersonId },
    data: { profileClaimed: true, profileClaimedAt: new Date() },
  })
  await logAdminAction('VAKMAN_FORCE_CLAIM', {
    tradespersonId,
    companyName: tp.companyName,
  })
  revalidatePath(`/vakman/${tp.slug}`)
  revalidatePath(`/admin/vakmensen/${tradespersonId}`)
  return { ok: true }
}

export async function verifyKvkAction(tradespersonId: string): Promise<Result> {
  await requireAdminRole(['ADMIN', 'EDITOR'])
  const tp = await prisma.tradesperson.update({
    where: { id: tradespersonId },
    data: { kvkVerified: true, kvkVerifiedAt: new Date() },
    select: { slug: true, companyName: true },
  })
  await logAdminAction('VAKMAN_KVK_VERIFY', {
    tradespersonId,
    companyName: tp.companyName,
  })
  revalidatePath(`/vakman/${tp.slug}`)
  revalidatePath(`/admin/vakmensen/${tradespersonId}`)
  return { ok: true }
}

export async function resendClaimEmailAction(tradespersonId: string): Promise<Result> {
  await requireAdminRole(['ADMIN', 'EDITOR'])

  const tp = await prisma.tradesperson.findUnique({
    where: { id: tradespersonId },
    select: { id: true, companyName: true, email: true },
  })
  if (!tp || !tp.email) return { ok: false, error: 'Geen e-mail bij dit profiel' }

  let plainEmail: string
  try {
    plainEmail = decrypt(tp.email)
  } catch {
    return { ok: false, error: 'Email kan niet worden ontsleuteld' }
  }

  const url = `${process.env.NEXTAUTH_URL ?? 'https://klushulpgids.nl'}/voor-vakmensen/claim`
  const { html, text } = claimInviteTemplate({ companyName: tp.companyName, url })
  const result = await sendEmail({
    to: plainEmail,
    subject: `Claim het profiel van ${tp.companyName}`,
    html,
    text,
  })
  if (!result.ok) return { ok: false, error: `Verzenden mislukt: ${result.error}` }

  await logAdminAction('VAKMAN_CLAIM_INVITE_RESENT', {
    tradespersonId,
    companyName: tp.companyName,
  })
  return { ok: true }
}

export async function deleteVakmanAction(tradespersonId: string): Promise<Result> {
  await requireAdminRole(['ADMIN'])

  const tp = await prisma.tradesperson.findUnique({
    where: { id: tradespersonId },
    select: {
      companyName: true,
      kvkNumber: true,
      emailHash: true,
      photos: { select: { storageKey: true } },
    },
  })
  if (!tp) return { ok: false, error: 'Niet gevonden' }

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
        reason: 'admin_delete',
      },
      update: { reason: 'admin_delete' },
    }),
    prisma.complianceLog.create({
      data: {
        eventType: 'ADMIN_VAKMAN_DELETE',
        metadata: {
          tradespersonId,
          companyName: tp.companyName,
          kvkNumber: tp.kvkNumber,
          at: new Date().toISOString(),
        },
      },
    }),
  ])

  revalidatePath('/admin/vakmensen')
  redirect('/admin/vakmensen')
}
