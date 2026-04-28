'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { putObject, deleteObject, publicUrlFor } from '@/lib/storage/objects'

type PhotoOut = {
  id: string
  url: string
  altText: string | null
  isCover: boolean
  displayOrder: number
  width: number | null
  height: number | null
}

type Result = { ok: true; photo?: PhotoOut } | { ok: false; error: string }

async function requireOwner() {
  const session = await auth()
  if (!session?.user?.tradespersonId) throw new Error('Niet geautoriseerd')
  return {
    userId: session.user.id,
    tradespersonId: session.user.tradespersonId,
  }
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_PHOTOS = 24

function extFromContentType(ct: string): string {
  if (ct === 'image/jpeg') return 'jpg'
  if (ct === 'image/png') return 'png'
  if (ct === 'image/webp') return 'webp'
  return 'bin'
}

export async function uploadPhotoAction(formData: FormData): Promise<Result> {
  const { userId, tradespersonId } = await requireOwner()

  const limit = await rateLimit(`photo-upload:${userId}`, 50, 60 * 60)
  if (!limit.allowed) {
    return { ok: false, error: 'Upload-limiet bereikt. Probeer over een uur opnieuw.' }
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { ok: false, error: 'Geen bestand ontvangen' }
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: 'Alleen JPG, PNG of WebP toegestaan' }
  }
  if (file.size > MAX_SIZE) {
    return { ok: false, error: 'Bestand te groot (max 5 MB)' }
  }

  const photoCount = await prisma.tradespersonPhoto.count({ where: { tradespersonId } })
  if (photoCount >= MAX_PHOTOS) {
    return { ok: false, error: `Maximum ${MAX_PHOTOS} foto's per profiel` }
  }

  const photoId = randomUUID()
  const ext = extFromContentType(file.type)
  const key = `tradespeople/${tradespersonId}/${photoId}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await putObject({ key, body: buffer, contentType: file.type })
  } catch (err) {
    return {
      ok: false,
      error: `Upload mislukt: ${(err as Error).message ?? 'onbekende fout'}`,
    }
  }

  const url = publicUrlFor(key)
  const isFirstPhoto = photoCount === 0

  const created = await prisma.tradespersonPhoto.create({
    data: {
      id: photoId,
      tradespersonId,
      url,
      storageKey: key,
      isCover: isFirstPhoto,
      displayOrder: photoCount,
    },
    select: {
      id: true,
      url: true,
      altText: true,
      isCover: true,
      displayOrder: true,
      width: true,
      height: true,
    },
  })

  const tp = await prisma.tradesperson.findUnique({
    where: { id: tradespersonId },
    select: { slug: true },
  })
  if (tp) revalidatePath(`/vakman/${tp.slug}`)
  revalidatePath('/dashboard/fotos')
  revalidatePath('/dashboard')

  return { ok: true, photo: created }
}

const deleteSchema = z.object({ photoId: z.string().uuid() })

export async function deletePhotoAction(formData: FormData): Promise<Result> {
  const { tradespersonId } = await requireOwner()
  const parsed = deleteSchema.safeParse({ photoId: formData.get('photoId') })
  if (!parsed.success) return { ok: false, error: 'Ongeldige foto-id' }

  const photo = await prisma.tradespersonPhoto.findUnique({
    where: { id: parsed.data.photoId },
    select: { tradespersonId: true, storageKey: true },
  })
  if (!photo || photo.tradespersonId !== tradespersonId) {
    return { ok: false, error: 'Foto niet gevonden' }
  }

  if (photo.storageKey) {
    await deleteObject(photo.storageKey).catch(() => undefined)
  }
  await prisma.tradespersonPhoto.delete({ where: { id: parsed.data.photoId } })

  const tp = await prisma.tradesperson.findUnique({
    where: { id: tradespersonId },
    select: { slug: true },
  })
  if (tp) revalidatePath(`/vakman/${tp.slug}`)
  revalidatePath('/dashboard/fotos')
  return { ok: true }
}

const coverSchema = z.object({ photoId: z.string().uuid() })

export async function setCoverPhotoAction(formData: FormData): Promise<Result> {
  const { tradespersonId } = await requireOwner()
  const parsed = coverSchema.safeParse({ photoId: formData.get('photoId') })
  if (!parsed.success) return { ok: false, error: 'Ongeldige foto-id' }

  const photo = await prisma.tradespersonPhoto.findUnique({
    where: { id: parsed.data.photoId },
    select: { tradespersonId: true },
  })
  if (!photo || photo.tradespersonId !== tradespersonId) {
    return { ok: false, error: 'Foto niet gevonden' }
  }

  await prisma.$transaction([
    prisma.tradespersonPhoto.updateMany({
      where: { tradespersonId },
      data: { isCover: false },
    }),
    prisma.tradespersonPhoto.update({
      where: { id: parsed.data.photoId },
      data: { isCover: true },
    }),
  ])

  const tp = await prisma.tradesperson.findUnique({
    where: { id: tradespersonId },
    select: { slug: true },
  })
  if (tp) revalidatePath(`/vakman/${tp.slug}`)
  revalidatePath('/dashboard/fotos')
  return { ok: true }
}

const altSchema = z.object({
  photoId: z.string().uuid(),
  altText: z.string().trim().max(120),
})

export async function updatePhotoAltAction(formData: FormData): Promise<Result> {
  const { tradespersonId } = await requireOwner()
  const parsed = altSchema.safeParse({
    photoId: formData.get('photoId'),
    altText: formData.get('altText'),
  })
  if (!parsed.success) return { ok: false, error: 'Alt-tekst is te lang (max 120 tekens)' }

  const photo = await prisma.tradespersonPhoto.findUnique({
    where: { id: parsed.data.photoId },
    select: { tradespersonId: true },
  })
  if (!photo || photo.tradespersonId !== tradespersonId) {
    return { ok: false, error: 'Foto niet gevonden' }
  }

  await prisma.tradespersonPhoto.update({
    where: { id: parsed.data.photoId },
    data: { altText: parsed.data.altText || null },
  })

  const tp = await prisma.tradesperson.findUnique({
    where: { id: tradespersonId },
    select: { slug: true },
  })
  if (tp) revalidatePath(`/vakman/${tp.slug}`)
  return { ok: true }
}
