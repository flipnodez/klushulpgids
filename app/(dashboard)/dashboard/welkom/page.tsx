import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hashEmail } from '@/lib/encryption'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'

import styles from '../../../(public)/inloggen/page.module.css'

export const metadata: Metadata = {
  title: 'Welkom in uw dashboard',
  robots: { index: false, follow: false },
}

export default async function WelkomPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/inloggen')

  const sp = await searchParams
  const claimId = sp.claim?.trim()

  let claimed = false
  let companyName: string | null = null

  if (claimId && !session.user.tradespersonId) {
    // Verifieer match: het session-email moet overeenkomen met de
    // versleutelde email van de tradesperson, anders is dit een poging
    // tot account-takeover.
    const sessionEmail = session.user.email?.toLowerCase()
    if (sessionEmail) {
      const expectedHash = hashEmail(sessionEmail)
      const tp = await prisma.tradesperson.findUnique({
        where: { id: claimId },
        select: {
          id: true,
          companyName: true,
          emailHash: true,
          profileClaimed: true,
        },
      })

      if (tp && !tp.profileClaimed && tp.emailHash && tp.emailHash === expectedHash) {
        await prisma.$transaction([
          prisma.tradesperson.update({
            where: { id: tp.id },
            data: { profileClaimed: true, profileClaimedAt: new Date() },
          }),
          prisma.user.update({
            where: { id: session.user.id },
            data: { tradespersonId: tp.id, role: 'TRADESPERSON' },
          }),
          prisma.complianceLog.create({
            data: {
              eventType: 'PROFILE_CLAIMED',
              metadata: {
                userId: session.user.id,
                tradespersonId: tp.id,
                at: new Date().toISOString(),
              },
            },
          }),
        ])
        claimed = true
        companyName = tp.companyName
      }
    }
  }

  return (
    <Container>
      <article className={styles.wrap}>
        <EmDashLabel>Welkom</EmDashLabel>
        {claimed ? (
          <>
            <h1 className={styles.title}>
              Profiel <em className={styles.italic}>geclaimd</em>
            </h1>
            <p className={styles.lede}>
              U bent nu de eigenaar van het profiel <strong>{companyName}</strong>. Tijd om uw
              profiel compleet te maken.
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Welkom in uw dashboard</h1>
            <p className={styles.lede}>
              U bent ingelogd. Vanaf hier beheert u uw bedrijfsprofiel, foto’s, beschikbaarheid en
              reviews.
            </p>
          </>
        )}

        <div className={styles.form}>
          <p className={styles.label}>Volgende stappen</p>
          <ul style={{ margin: 0, paddingLeft: '1.2em', lineHeight: 1.8 }}>
            <li>
              <Link href="/dashboard/profiel" className={styles.link}>
                Vul uw profielbeschrijving aan
              </Link>
            </li>
            <li>
              <Link href="/dashboard/fotos" className={styles.link}>
                Upload foto’s van uw werk
              </Link>
            </li>
            <li>
              <Link href="/dashboard/beschikbaarheid" className={styles.link}>
                Zet uw huidige beschikbaarheid
              </Link>
            </li>
          </ul>
        </div>

        <p className={styles.foot}>
          <Link href="/dashboard" className={styles.link}>
            → Naar het overzicht
          </Link>
        </p>
      </article>
    </Container>
  )
}
