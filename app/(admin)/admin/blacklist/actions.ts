'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { hashEmail } from '@/lib/encryption'
import { logAdminAction, requireAdminRole } from '@/lib/admin/audit'

type Result = { ok: true } | { ok: false; error: string }

const addSchema = z
  .object({
    kvk: z.string().trim().optional().or(z.literal('')),
    email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
    reason: z.string().trim().min(2).max(200),
  })
  .refine((d) => d.kvk || d.email, { message: 'Vul KvK of e-mail in' })

export async function addBlacklistAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN'])
  const parsed = addSchema.safeParse({
    kvk: formData.get('kvk'),
    email: formData.get('email'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ongeldig' }

  const kvk = parsed.data.kvk?.replace(/\D/g, '') || null
  if (kvk && !/^\d{8}$/.test(kvk)) return { ok: false, error: 'KvK moet 8 cijfers zijn' }
  const emailHash = parsed.data.email ? hashEmail(parsed.data.email) : null

  await prisma.optOutBlacklist.create({
    data: { kvkNumber: kvk, emailHash, reason: parsed.data.reason },
  })

  await logAdminAction('BLACKLIST_ADD', {
    kvkNumber: kvk,
    emailHash,
    reason: parsed.data.reason,
  })

  revalidatePath('/admin/blacklist')
  return { ok: true }
}

const removeSchema = z.object({ id: z.string().uuid() })

export async function removeBlacklistAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN'])
  const parsed = removeSchema.safeParse({ id: formData.get('id') })
  if (!parsed.success) return { ok: false, error: 'Ongeldige id' }

  const entry = await prisma.optOutBlacklist.findUnique({
    where: { id: parsed.data.id },
    select: { kvkNumber: true, emailHash: true, reason: true },
  })
  if (!entry) return { ok: false, error: 'Niet gevonden' }

  await prisma.optOutBlacklist.delete({ where: { id: parsed.data.id } })

  await logAdminAction('BLACKLIST_REMOVE', {
    kvkNumber: entry.kvkNumber,
    emailHash: entry.emailHash,
    reason: entry.reason,
  })

  revalidatePath('/admin/blacklist')
  return { ok: true }
}
