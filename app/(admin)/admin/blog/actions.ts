'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { putObject } from '@/lib/storage/objects'
import { logAdminAction, requireAdminRole } from '@/lib/admin/audit'

type Result = { ok: true; id?: string } | { ok: false; error: string }

const FAQ_SHAPE = z.array(
  z.object({
    question: z.string().trim().min(3).max(200),
    answer: z.string().trim().min(10).max(1000),
  }),
)
const HOWTO_SHAPE = z.array(
  z.object({ name: z.string().trim().min(3).max(200), text: z.string().trim().min(10).max(1000) }),
)

const upsertSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug mag alleen kleine letters, cijfers en streepjes bevatten'),
  title: z.string().trim().min(3).max(200),
  metaDescription: z.string().trim().min(20).max(200),
  excerpt: z.string().trim().min(20).max(400),
  body: z.string().trim().min(100).max(40000),
  coverImageUrl: z.string().trim().url().optional().or(z.literal('')),
  coverImageAlt: z.string().trim().max(200).optional().or(z.literal('')),
  authorName: z.string().trim().min(2).max(120),
  category: z.enum([
    'KOSTEN',
    'TIPS',
    'VERDUURZAMEN',
    'REGELGEVING',
    'VERHALEN',
    'VAKMANNEN',
    'HOE_DOE_JE',
  ]),
  relatedTradeId: z.string().trim().optional().or(z.literal('')),
  relatedCityId: z.string().trim().optional().or(z.literal('')),
  faqJson: z.string().optional().or(z.literal('')),
  howToJson: z.string().optional().or(z.literal('')),
})

function parseFaqOrEmpty(raw: string | undefined | null) {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    const result = FAQ_SHAPE.safeParse(parsed)
    if (!result.success) return null
    return result.data.length > 0 ? result.data : null
  } catch {
    return null
  }
}

function parseHowToOrEmpty(raw: string | undefined | null) {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    const result = HOWTO_SHAPE.safeParse(parsed)
    if (!result.success) return null
    return result.data.length > 0 ? result.data : null
  } catch {
    return null
  }
}

export async function createBlogPostAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN', 'EDITOR'])

  const parsed = upsertSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige invoer' }
  }
  const data = parsed.data

  const existing = await prisma.blogPost.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  })
  if (existing) return { ok: false, error: 'Slug bestaat al' }

  const post = await prisma.blogPost.create({
    data: {
      slug: data.slug,
      title: data.title,
      metaDescription: data.metaDescription,
      excerpt: data.excerpt,
      body: data.body,
      coverImageUrl: data.coverImageUrl || null,
      coverImageAlt: data.coverImageAlt || null,
      authorName: data.authorName,
      category: data.category,
      relatedTradeId: data.relatedTradeId || null,
      relatedCityId: data.relatedCityId || null,
      faqItems: parseFaqOrEmpty(data.faqJson) ?? undefined,
      howToSteps: parseHowToOrEmpty(data.howToJson) ?? undefined,
    },
    select: { id: true, slug: true },
  })

  await logAdminAction('BLOG_CREATE', {
    postId: post.id,
    slug: post.slug,
    title: data.title,
  })

  revalidatePath('/blog')
  revalidatePath('/admin/blog')
  return { ok: true, id: post.id }
}

export async function updateBlogPostAction(postId: string, formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN', 'EDITOR'])

  const parsed = upsertSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ongeldige invoer' }
  }
  const data = parsed.data

  const collision = await prisma.blogPost.findFirst({
    where: { slug: data.slug, NOT: { id: postId } },
    select: { id: true },
  })
  if (collision) return { ok: false, error: 'Slug bestaat al bij een andere post' }

  const post = await prisma.blogPost.update({
    where: { id: postId },
    data: {
      slug: data.slug,
      title: data.title,
      metaDescription: data.metaDescription,
      excerpt: data.excerpt,
      body: data.body,
      coverImageUrl: data.coverImageUrl || null,
      coverImageAlt: data.coverImageAlt || null,
      authorName: data.authorName,
      category: data.category,
      relatedTradeId: data.relatedTradeId || null,
      relatedCityId: data.relatedCityId || null,
      faqItems: parseFaqOrEmpty(data.faqJson) ?? undefined,
      howToSteps: parseHowToOrEmpty(data.howToJson) ?? undefined,
    },
    select: { slug: true },
  })

  await logAdminAction('BLOG_UPDATE', { postId, slug: post.slug, title: data.title })

  revalidatePath('/blog')
  revalidatePath(`/blog/${post.slug}`)
  revalidatePath('/admin/blog')
  return { ok: true, id: postId }
}

const idSchema = z.object({ postId: z.string().uuid() })

export async function deleteBlogPostAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN'])
  const parsed = idSchema.safeParse({ postId: formData.get('postId') })
  if (!parsed.success) return { ok: false, error: 'Ongeldige id' }

  const post = await prisma.blogPost.findUnique({
    where: { id: parsed.data.postId },
    select: { slug: true, title: true },
  })
  if (!post) return { ok: false, error: 'Niet gevonden' }

  await prisma.blogPost.delete({ where: { id: parsed.data.postId } })
  await logAdminAction('BLOG_DELETE', {
    postId: parsed.data.postId,
    slug: post.slug,
    title: post.title,
  })

  revalidatePath('/blog')
  revalidatePath(`/blog/${post.slug}`)
  redirect('/admin/blog')
}

export async function publishBlogPostAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN', 'EDITOR'])
  const parsed = idSchema.safeParse({ postId: formData.get('postId') })
  if (!parsed.success) return { ok: false, error: 'Ongeldige id' }

  const post = await prisma.blogPost.update({
    where: { id: parsed.data.postId },
    data: { publishedAt: new Date() },
    select: { slug: true, title: true },
  })
  await logAdminAction('BLOG_PUBLISH', {
    postId: parsed.data.postId,
    slug: post.slug,
    title: post.title,
  })
  revalidatePath('/blog')
  revalidatePath(`/blog/${post.slug}`)
  return { ok: true }
}

export async function unpublishBlogPostAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN', 'EDITOR'])
  const parsed = idSchema.safeParse({ postId: formData.get('postId') })
  if (!parsed.success) return { ok: false, error: 'Ongeldige id' }

  const post = await prisma.blogPost.update({
    where: { id: parsed.data.postId },
    data: { publishedAt: null },
    select: { slug: true, title: true },
  })
  await logAdminAction('BLOG_UNPUBLISH', {
    postId: parsed.data.postId,
    slug: post.slug,
    title: post.title,
  })
  revalidatePath('/blog')
  revalidatePath(`/blog/${post.slug}`)
  return { ok: true }
}

export async function uploadCoverImageAction(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdminRole(['ADMIN', 'EDITOR'])

  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, error: 'Geen bestand' }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { ok: false, error: 'Alleen JPG, PNG of WebP' }
  }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'Bestand > 5 MB' }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const key = `blog/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const { publicUrl } = await putObject({ key, body: buffer, contentType: file.type })
    await logAdminAction('BLOG_COVER_UPLOAD', { key })
    return { ok: true, url: publicUrl }
  } catch (err) {
    return { ok: false, error: `Upload mislukt: ${(err as Error).message}` }
  }
}
