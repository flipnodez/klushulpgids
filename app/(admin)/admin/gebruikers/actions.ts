'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logAdminAction, requireAdminRole } from '@/lib/admin/audit'

type Result = { ok: true } | { ok: false; error: string }

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['ADMIN', 'EDITOR', 'TRADESPERSON', 'CONSUMER']),
})

export async function updateUserRoleAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN'])
  const session = await auth()

  const parsed = roleSchema.safeParse({
    userId: formData.get('userId'),
    role: formData.get('role'),
  })
  if (!parsed.success) return { ok: false, error: 'Ongeldige rol' }

  // Voorkom self-demotion: laatste admin mag zichzelf niet downgraden
  if (parsed.data.userId === session?.user?.id && parsed.data.role !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount <= 1) {
      return {
        ok: false,
        error: 'Kan jezelf niet downgraden — je bent de enige ADMIN.',
      }
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { email: true, role: true },
  })
  if (!user) return { ok: false, error: 'Niet gevonden' }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  })

  await logAdminAction('USER_ROLE_CHANGE', {
    userId: parsed.data.userId,
    email: user.email,
    fromRole: user.role,
    toRole: parsed.data.role,
  })

  revalidatePath('/admin/gebruikers')
  return { ok: true }
}

const deleteSchema = z.object({ userId: z.string().uuid() })

export async function deleteUserAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN'])
  const session = await auth()

  const parsed = deleteSchema.safeParse({ userId: formData.get('userId') })
  if (!parsed.success) return { ok: false, error: 'Ongeldige id' }

  if (parsed.data.userId === session?.user?.id) {
    return { ok: false, error: 'Kan jezelf niet verwijderen.' }
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { email: true, role: true },
  })
  if (!user) return { ok: false, error: 'Niet gevonden' }

  await prisma.user.delete({ where: { id: parsed.data.userId } })

  await logAdminAction('USER_DELETE', {
    userId: parsed.data.userId,
    email: user.email,
    role: user.role,
  })

  revalidatePath('/admin/gebruikers')
  return { ok: true }
}
