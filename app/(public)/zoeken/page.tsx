import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { TradespersonCard } from '@/components/features/tradesperson/TradespersonCard'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'
import { SearchInput } from '@/components/ui/SearchInput'
import { resolveCityFromInput, resolveTradeFromInput, searchTradespeople } from '@/lib/queries'
import { prisma } from '@/lib/db'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Zoekresultaten',
  description: 'Zoek vakmensen in de gids op vakgebied, stad of bedrijfsnaam.',
  robots: { index: false },
}

type SearchParams = {
  vak?: string
  plaats?: string
  q?: string
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default async function ZoekenPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const vakInput = sp.vak?.trim()
  const plaatsInput = sp.plaats?.trim()
  const queryInput = sp.q?.trim()

  // 1) Beide vak + plaats → tolerante match en redirect
  if (vakInput && plaatsInput) {
    const [trade, city] = await Promise.all([
      resolveTradeFromInput(vakInput),
      resolveCityFromInput(plaatsInput),
    ])

    if (trade && city) {
      redirect(`/${trade.slug}/${city.slug}`)
    }
    if (trade && !city) {
      redirect(`/${trade.slug}`)
    }
    if (!trade && city) {
      redirect(`/plaats/${city.slug}`)
    }
  }

  // 2) Alleen vak → redirect
  if (vakInput && !plaatsInput) {
    const trade = await resolveTradeFromInput(vakInput)
    if (trade) redirect(`/${trade.slug}`)
  }

  // 3) Alleen plaats → redirect
  if (plaatsInput && !vakInput) {
    const city = await resolveCityFromInput(plaatsInput)
    if (city) redirect(`/plaats/${city.slug}`)
  }

  // 4) Vrije zoekterm of geen exacte match → toon resultaten
  const term = queryInput || [vakInput, plaatsInput].filter(Boolean).join(' ')
  const results = term ? await searchTradespeople(term, 30) : []

  // 5) Suggesties bij geen resultaten
  const suggestions =
    results.length === 0 && term
      ? await prisma.trade.findMany({
          where: {
            OR: [
              { nameSingular: { contains: term, mode: 'insensitive' } },
              { namePlural: { contains: term, mode: 'insensitive' } },
              { slug: { contains: slugify(term) } },
            ],
          },
          take: 5,
          select: { slug: true, namePlural: true },
        })
      : []

  return (
    <Container>
      <div className={styles.crumbWrap}>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Zoeken' }]} />
      </div>

      <header className={styles.hero}>
        <EmDashLabel>Zoekresultaten</EmDashLabel>
        <h1 className={styles.title}>
          {term ? (
            <>
              {results.length} resultaten voor <em className={styles.italic}>{term}</em>
            </>
          ) : (
            <>
              Zoek in <em className={styles.italic}>de gids</em>
            </>
          )}
        </h1>
        <div className={styles.searchWrap}>
          <SearchInput initialVak={vakInput} initialPlaats={plaatsInput} action="/api/search" />
        </div>
      </header>

      <Rule variant="thick" />

      {term && results.length === 0 ? (
        <div className={styles.empty}>
          <p className="muted">
            Geen vakmensen gevonden voor <strong>{term}</strong>.
          </p>
          {suggestions.length > 0 && (
            <div className={styles.suggestions}>
              <span className="label label-muted">Probeer een vakgebied:</span>
              <ul className={styles.suggestionList}>
                {suggestions.map((s) => (
                  <li key={s.slug}>
                    <a href={`/${s.slug}`} className={styles.suggestionLink}>
                      {s.namePlural}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : term ? (
        <ul className={styles.results}>
          {results.map((tp) => {
            const tpTrade = tp.trades[0]?.trade
            return (
              <li key={tp.id}>
                <TradespersonCard
                  data={{
                    slug: tp.slug,
                    companyName: tp.companyName,
                    cityName: tp.city?.name,
                    tradeName: tpTrade?.nameSingular,
                    foundedYear: tp.foundedYear,
                    ratingAvg: tp.ratingAvg,
                    ratingCount: tp.ratingCount,
                    googleRating: tp.googleRating,
                    googleReviewsCount: tp.googleReviewsCount,
                    specialties: tp.specialties,
                    availabilityStatus: tp.availabilityStatus,
                    availabilityUpdatedAt: tp.availabilityUpdatedAt?.toISOString(),
                    phone: tp.phone,
                    tier: tp.tier,
                  }}
                  href={`/vakman/${tp.slug}`}
                />
              </li>
            )
          })}
        </ul>
      ) : (
        <p className={`muted ${styles.empty}`}>Vul een vakgebied en/of plaats in om te zoeken.</p>
      )}
    </Container>
  )
}
