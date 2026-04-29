import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { prisma } from '@/lib/db'

import { ReviewVerifyForm } from './ReviewVerifyForm'
import { ReviewSubmitForm } from './ReviewSubmitForm'

import styles from '../../../inloggen/page.module.css'

export const metadata: Metadata = {
  title: 'Schrijf een review',
  robots: { index: false, follow: false },
}

type Params = { slug: string }
type SearchParams = { token?: string }

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])

  const tp = await prisma.tradesperson.findUnique({
    where: { slug },
    select: { id: true, slug: true, companyName: true, city: { select: { name: true } } },
  })
  if (!tp) notFound()

  const hasToken = !!sp.token

  // Optional: validate token bestaat (zonder te 'verbruiken'). Niet strict nodig
  // — submit-action valideert hem opnieuw.

  return (
    <Container>
      <div className={styles.crumbs}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: tp.companyName, href: `/vakman/${tp.slug}` },
            { label: 'Review schrijven' },
          ]}
        />
      </div>
      <article className={styles.wrap}>
        <EmDashLabel>Reviews</EmDashLabel>
        {hasToken ? (
          <>
            <h1 className={styles.title}>
              Schrijf uw <em className={styles.italic}>review</em>
            </h1>
            <p className={styles.lede}>
              U schrijft een review voor <strong>{tp.companyName}</strong>
              {tp.city && <> in {tp.city.name}</>}. Reviews worden door onze redactie gecontroleerd
              voordat ze worden geplaatst.
            </p>
            <ReviewSubmitForm slug={tp.slug} token={sp.token!} companyName={tp.companyName} />
          </>
        ) : (
          <>
            <h1 className={styles.title}>
              Review voor <em className={styles.italic}>{tp.companyName}</em>
            </h1>
            <p className={styles.lede}>
              Wij sturen u eerst een verificatielink. Klik op de link in uw e-mail om uw review te
              schrijven — zo voorkomen we spam en valse reviews.
            </p>
            <ReviewVerifyForm slug={tp.slug} />
            <p className={styles.foot}>
              <Link href={`/vakman/${tp.slug}`} className={styles.link}>
                ← Terug naar profiel
              </Link>
            </p>
          </>
        )}
      </article>
    </Container>
  )
}
