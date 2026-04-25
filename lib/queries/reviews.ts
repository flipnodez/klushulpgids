import 'server-only'

import type { Prisma } from '@prisma/client'

import { prisma } from '../db'

const PUBLIC_REVIEW_SELECT = {
  id: true,
  rating: true,
  title: true,
  body: true,
  jobDate: true,
  reviewerName: true,
  reviewerCity: true,
  verificationMethod: true,
  ownerResponse: true,
  ownerResponseAt: true,
  createdAt: true,
  approvedAt: true,
} satisfies Prisma.ReviewSelect

export type PublicReview = Prisma.ReviewGetPayload<{ select: typeof PUBLIC_REVIEW_SELECT }>

/** Alleen goedgekeurde reviews — voor publieke pagina's. */
export async function getApprovedReviews(
  tradespersonId: string,
  opts: { take?: number; skip?: number } = {},
): Promise<PublicReview[]> {
  const { take = 20, skip = 0 } = opts
  return prisma.review.findMany({
    where: { tradespersonId, status: 'APPROVED' },
    select: PUBLIC_REVIEW_SELECT,
    orderBy: { createdAt: 'desc' },
    take,
    skip,
  })
}

export async function calculateAverageRating(
  tradespersonId: string,
): Promise<{ avg: number | null; count: number }> {
  const result = await prisma.review.aggregate({
    where: { tradespersonId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { _all: true },
  })
  return {
    avg: result._avg.rating ?? null,
    count: result._count._all,
  }
}

/** Alleen voor admin/dashboard — bevat ook PENDING/REJECTED. */
export async function getAllReviewsForTradesperson(
  tradespersonId: string,
): Promise<PublicReview[]> {
  return prisma.review.findMany({
    where: { tradespersonId },
    select: PUBLIC_REVIEW_SELECT,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPendingReviewCount(): Promise<number> {
  return prisma.review.count({ where: { status: 'PENDING' } })
}
