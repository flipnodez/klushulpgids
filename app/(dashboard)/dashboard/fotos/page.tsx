import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

import { PhotoManager } from './PhotoManager'
import styles from '../shared.module.css'

export const metadata: Metadata = {
  title: 'Foto’s beheren',
  robots: { index: false, follow: false },
}

export default async function FotosPage() {
  const session = await auth()
  if (!session?.user.tradespersonId) redirect('/dashboard/welkom')

  const photos = await prisma.tradespersonPhoto.findMany({
    where: { tradespersonId: session.user.tradespersonId },
    orderBy: { displayOrder: 'asc' },
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

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Foto’s</p>
        <h1 className={styles.h1}>Toon uw werk</h1>
        <p className={styles.lede}>
          Profielen met minstens 3 foto’s krijgen 4× zo vaak contact. Upload JPG of PNG, max 5 MB
          per foto.
        </p>
      </header>

      <PhotoManager photos={photos} />
    </div>
  )
}
