import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { ReviewList } from './ReviewList'
import styles from '../shared.module.css'

export const metadata: Metadata = {
  title: 'Reviews',
  robots: { index: false, follow: false },
}

export default async function ReviewsPage() {
  const session = await auth()
  if (!session?.user.tradespersonId) redirect('/dashboard/welkom')

  const reviews = await prisma.review.findMany({
    where: {
      tradespersonId: session.user.tradespersonId,
      status: 'APPROVED',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      reviewerName: true,
      reviewerCity: true,
      rating: true,
      title: true,
      body: true,
      createdAt: true,
      ownerResponse: true,
      ownerResponseAt: true,
      flagged: true,
    },
  })

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Reviews</p>
        <h1 className={styles.h1}>Klantbeoordelingen</h1>
        <p className={styles.lede}>
          Reageer op reviews om vertrouwen op te bouwen. Onterechte reviews kunt u melden — onze
          redactie kijkt er dan naar.
        </p>
      </header>

      <ReviewList
        reviews={reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          ownerResponseAt: r.ownerResponseAt?.toISOString() ?? null,
        }))}
      />
    </div>
  )
}
