'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email/lettermint'
import { reviewNotificationTemplate } from '@/lib/email/templates/reviewNotification'
import { decrypt } from '@/lib/encryption'
import { logAdminAction, requireAdminRole } from '@/lib/admin/audit'

type Result = { ok: true } | { ok: false; error: string }

const idSchema = z.object({ reviewId: z.string().uuid() })

export async function approveReviewAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN', 'EDITOR'])
  const parsed = idSchema.safeParse({ reviewId: formData.get('reviewId') })
  if (!parsed.success) return { ok: false, error: 'Ongeldige review-id' }

  const review = await prisma.review.update({
    where: { id: parsed.data.reviewId },
    data: { status: 'APPROVED', approvedAt: new Date(), flagged: false, flagReason: null },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      reviewerName: true,
      tradesperson: {
        select: {
          id: true,
          slug: true,
          companyName: true,
          email: true,
        },
      },
    },
  })

  // Update aggregate rating op tradesperson
  const stats = await prisma.review.aggregate({
    where: { tradespersonId: review.tradesperson.id, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { _all: true },
  })
  await prisma.tradesperson.update({
    where: { id: review.tradesperson.id },
    data: {
      ratingAvg: stats._avg.rating,
      ratingCount: stats._count._all,
    },
  })

  // Notification mail naar vakman (best-effort)
  if (review.tradesperson.email) {
    try {
      const plainEmail = decrypt(review.tradesperson.email)
      const dashboardUrl = `${process.env.NEXTAUTH_URL ?? 'https://klushulpgids.nl'}/dashboard/reviews`
      const { html, text } = reviewNotificationTemplate({
        companyName: review.tradesperson.companyName,
        reviewerName: review.reviewerName,
        rating: review.rating,
        excerpt: (review.title ?? review.body).slice(0, 100),
        dashboardUrl,
      })
      await sendEmail({
        to: plainEmail,
        subject: `Nieuwe review op ${review.tradesperson.companyName}`,
        html,
        text,
      })
    } catch {
      // ignore — main task is approval, mail is bonus
    }
  }

  await logAdminAction('REVIEW_APPROVE', {
    reviewId: review.id,
    tradespersonId: review.tradesperson.id,
  })

  revalidatePath(`/vakman/${review.tradesperson.slug}`)
  revalidatePath('/admin/reviews')
  revalidatePath('/admin')
  return { ok: true }
}

const rejectSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.string().trim().max(500).optional().or(z.literal('')),
})

export async function rejectReviewAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN', 'EDITOR'])
  const parsed = rejectSchema.safeParse({
    reviewId: formData.get('reviewId'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) return { ok: false, error: 'Ongeldige invoer' }

  const review = await prisma.review.update({
    where: { id: parsed.data.reviewId },
    data: {
      status: 'REJECTED',
      flagReason: parsed.data.reason || null,
    },
    select: { id: true, tradesperson: { select: { id: true, slug: true } } },
  })

  await logAdminAction('REVIEW_REJECT', {
    reviewId: review.id,
    tradespersonId: review.tradesperson.id,
    reason: parsed.data.reason,
  })

  revalidatePath(`/vakman/${review.tradesperson.slug}`)
  revalidatePath('/admin/reviews')
  return { ok: true }
}

export async function markSpamReviewAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN', 'EDITOR'])
  const parsed = idSchema.safeParse({ reviewId: formData.get('reviewId') })
  if (!parsed.success) return { ok: false, error: 'Ongeldige review-id' }

  const review = await prisma.review.findUnique({
    where: { id: parsed.data.reviewId },
    select: {
      id: true,
      reviewerEmailHash: true,
      ipAddressHash: true,
      tradesperson: { select: { id: true, slug: true } },
    },
  })
  if (!review) return { ok: false, error: 'Niet gevonden' }

  await prisma.$transaction([
    prisma.review.update({
      where: { id: review.id },
      data: { status: 'REJECTED', flagged: true, flagReason: 'spam' },
    }),
    // Voeg email-hash toe aan blacklist (als aanwezig)
    ...(review.reviewerEmailHash
      ? [
          prisma.optOutBlacklist.upsert({
            where: { emailHash: review.reviewerEmailHash },
            create: { emailHash: review.reviewerEmailHash, reason: 'review_spam' },
            update: { reason: 'review_spam' },
          }),
        ]
      : []),
  ])

  await logAdminAction('REVIEW_MARK_SPAM', {
    reviewId: review.id,
    tradespersonId: review.tradesperson.id,
    emailHash: review.reviewerEmailHash,
    ipHash: review.ipAddressHash,
  })

  revalidatePath(`/vakman/${review.tradesperson.slug}`)
  revalidatePath('/admin/reviews')
  return { ok: true }
}

export async function clearReviewFlagAction(formData: FormData): Promise<Result> {
  await requireAdminRole(['ADMIN', 'EDITOR'])
  const parsed = idSchema.safeParse({ reviewId: formData.get('reviewId') })
  if (!parsed.success) return { ok: false, error: 'Ongeldige review-id' }

  const review = await prisma.review.update({
    where: { id: parsed.data.reviewId },
    data: { flagged: false, flagReason: null },
    select: { id: true, tradesperson: { select: { id: true, slug: true } } },
  })

  await logAdminAction('REVIEW_FLAG_CLEAR', {
    reviewId: review.id,
    tradespersonId: review.tradesperson.id,
  })

  revalidatePath(`/vakman/${review.tradesperson.slug}`)
  revalidatePath('/admin/reviews')
  return { ok: true }
}
