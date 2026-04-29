'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { encrypt, hashEmail } from '@/lib/encryption'
import { logAdminAction, requireAdminRole } from '@/lib/admin/audit'

type ImportResult =
  | {
      ok: true
      created: number
      updated: number
      skipped: { reason: string; row: string }[]
      total: number
    }
  | { ok: false; error: string }

const recordSchema = z.object({
  companyName: z.string().trim().min(2).max(200),
  kvkNumber: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'KvK moet 8 cijfers zijn'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug ongeldig')
    .optional(),
  citySlug: z.string().trim().min(2).max(80),
  tradeSlug: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  websiteUrl: z.string().trim().url().optional().or(z.literal('')),
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  hourlyRateMin: z.number().int().min(0).max(500).optional(),
  hourlyRateMax: z.number().int().min(0).max(500).optional(),
  qualityScore: z.number().int().min(0).max(100).optional(),
  specialties: z.array(z.string()).optional(),
})

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function importVakmenenAction(formData: FormData): Promise<ImportResult> {
  await requireAdminRole(['ADMIN'])

  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, error: 'Geen bestand ontvangen' }
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'Bestand > 10 MB' }

  const text = await file.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Ongeldige JSON' }
  }
  if (!Array.isArray(raw)) {
    return { ok: false, error: 'Top-level moet een array zijn' }
  }
  if (raw.length === 0) return { ok: false, error: 'Lege array' }
  if (raw.length > 5000) {
    return {
      ok: false,
      error: 'Te grote batch (>5000). Splits het bestand of gebruik het CLI-script.',
    }
  }

  // Cache trade & city lookups
  const [tradeBySlug, cityBySlug, blacklist] = await Promise.all([
    prisma.trade
      .findMany({ select: { id: true, slug: true } })
      .then((arr) => Object.fromEntries(arr.map((t) => [t.slug, t.id]))),
    prisma.city
      .findMany({ select: { id: true, slug: true } })
      .then((arr) => Object.fromEntries(arr.map((c) => [c.slug, c.id]))),
    prisma.optOutBlacklist.findMany({
      select: { kvkNumber: true, emailHash: true },
    }),
  ])

  const blacklistedKvk = new Set(blacklist.map((b) => b.kvkNumber).filter((k): k is string => !!k))
  const blacklistedEmail = new Set(
    blacklist.map((b) => b.emailHash).filter((h): h is string => !!h),
  )

  let created = 0
  let updated = 0
  const skipped: { reason: string; row: string }[] = []

  for (const [idx, row] of raw.entries()) {
    const label = `row #${idx + 1}`
    const parsed = recordSchema.safeParse(row)
    if (!parsed.success) {
      skipped.push({
        reason: `validation: ${parsed.error.issues[0]?.message ?? 'onbekend'}`,
        row: label,
      })
      continue
    }
    const data = parsed.data

    if (blacklistedKvk.has(data.kvkNumber)) {
      skipped.push({ reason: 'blacklist (KvK)', row: `${label} ${data.companyName}` })
      continue
    }
    if (data.email && blacklistedEmail.has(hashEmail(data.email))) {
      skipped.push({ reason: 'blacklist (email)', row: `${label} ${data.companyName}` })
      continue
    }

    const cityId = cityBySlug[data.citySlug]
    if (!cityId) {
      skipped.push({
        reason: `city '${data.citySlug}' onbekend`,
        row: `${label} ${data.companyName}`,
      })
      continue
    }

    const slug = data.slug ?? slugify(`${data.companyName}-${data.citySlug}`).slice(0, 80)

    const upsertData = {
      companyName: data.companyName,
      slug,
      kvkNumber: data.kvkNumber,
      cityId,
      email: data.email ? encrypt(data.email) : null,
      emailHash: data.email ? hashEmail(data.email) : null,
      phone: data.phone || null,
      websiteUrl: data.websiteUrl || null,
      description: data.description || null,
      hourlyRateMin: data.hourlyRateMin ?? null,
      hourlyRateMax: data.hourlyRateMax ?? null,
      qualityScore: data.qualityScore ?? 50,
      specialties: data.specialties ?? [],
    }

    try {
      const existing = await prisma.tradesperson.findUnique({
        where: { kvkNumber: data.kvkNumber },
        select: { id: true },
      })
      if (existing) {
        await prisma.tradesperson.update({
          where: { id: existing.id },
          data: upsertData,
        })
        updated++
      } else {
        const tp = await prisma.tradesperson.create({ data: upsertData })
        created++
        // Trade-koppeling
        if (data.tradeSlug && tradeBySlug[data.tradeSlug]) {
          await prisma.tradespersonTrade.create({
            data: {
              tradespersonId: tp.id,
              tradeId: tradeBySlug[data.tradeSlug]!,
              isPrimary: true,
            },
          })
        }
      }
    } catch (err) {
      skipped.push({
        reason: `db error: ${(err as Error).message.slice(0, 80)}`,
        row: `${label} ${data.companyName}`,
      })
    }
  }

  await logAdminAction('IMPORT_RUN', {
    total: raw.length,
    created,
    updated,
    skipped: skipped.length,
    filename: file.name,
  })

  revalidatePath('/admin/vakmensen')

  return {
    ok: true,
    created,
    updated,
    skipped,
    total: raw.length,
  }
}
