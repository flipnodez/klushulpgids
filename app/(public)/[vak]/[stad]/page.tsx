import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { TradespersonCard } from '@/components/features/tradesperson/TradespersonCard'
import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'
import {
  countTradespeopleByVakAndCity,
  getCityBySlug,
  getNearbyCities,
  getRelatedTradesInCity,
  getSpecialtiesForVakAndCity,
  getTradeBySlug,
  getTradespeopleByVakAndCity,
  getVakCityStats,
} from '@/lib/queries'
import type { SortOption, TradespersonFilters } from '@/lib/queries'

import styles from './page.module.css'

export const revalidate = 3600 // 1 uur

type Params = { vak: string; stad: string }
type SearchParams = {
  pagina?: string
  sort?: string
  beschikbaar?: string | string[]
  rating?: string
  specialisme?: string
}

const PAGE_SIZE = 20

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { vak, stad } = await params
  const [trade, city] = await Promise.all([getTradeBySlug(vak), getCityBySlug(stad)])
  if (!trade || !city) return {}

  return {
    title: trade.seoTitleTemplate.replace('{city}', city.name),
    description: trade.seoDescriptionTemplate.replace('{city}', city.name),
    alternates: { canonical: `/${trade.slug}/${city.slug}` },
  }
}

function parseSort(value: string | undefined): SortOption {
  if (value === 'rating' || value === 'recent') return value
  return 'quality'
}

function parseAvailability(
  value: string | string[] | undefined,
): TradespersonFilters['availability'] {
  if (!value) return undefined
  const list = Array.isArray(value) ? value : [value]
  return list.filter((v): v is 'AVAILABLE_NOW' | 'AVAILABLE_THIS_WEEK' | 'AVAILABLE_THIS_MONTH' =>
    ['AVAILABLE_NOW', 'AVAILABLE_THIS_WEEK', 'AVAILABLE_THIS_MONTH'].includes(v),
  )
}

function formatNL(n: number): string {
  return new Intl.NumberFormat('nl-NL').format(n)
}

export default async function VakStadPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const [{ vak, stad }, sp] = await Promise.all([params, searchParams])
  const [trade, city] = await Promise.all([getTradeBySlug(vak), getCityBySlug(stad)])
  if (!trade || !city) notFound()

  const sort = parseSort(sp.sort)
  const page = Math.max(1, Number.parseInt(sp.pagina ?? '1', 10) || 1)
  const filters: TradespersonFilters = {
    availability: parseAvailability(sp.beschikbaar),
    minRating: sp.rating ? Number.parseFloat(sp.rating) : undefined,
    specialty: sp.specialisme,
  }

  const [results, totalCount, stats, specialties, relatedTrades, nearbyCities] = await Promise.all([
    getTradespeopleByVakAndCity(vak, stad, {
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      sort,
      filters,
    }),
    countTradespeopleByVakAndCity(vak, stad, filters),
    getVakCityStats(vak, stad),
    getSpecialtiesForVakAndCity(vak, stad),
    getRelatedTradesInCity(city.id, trade.id, 6),
    getNearbyCities(city, 6),
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const hasFilters =
    (filters.availability && filters.availability.length > 0) ||
    (filters.minRating ?? 0) > 0 ||
    !!filters.specialty

  // Auto-generated unieke lokale content
  const lokaalParagraaf = `In ${city.name} zijn ${formatNL(stats.count)} ${trade.namePlural.toLowerCase()} actief in onze gids${
    stats.avgRating
      ? `, met een gemiddelde beoordeling van ${stats.avgRating.toFixed(1)} sterren`
      : ''
  }. ${trade.namePlural} in ${city.name} werken onder andere voor woningbezitters in ${city.province}, en richten zich vaak op ${
    specialties.length > 0
      ? specialties.slice(0, 3).join(', ')
      : 'huishoudelijke installaties en kleinere klussen'
  }.`

  return (
    <>
      <Container>
        <div className={styles.crumbWrap}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: trade.namePlural, href: `/${trade.slug}` },
              { label: city.name },
            ]}
          />
        </div>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <header className={styles.hero}>
          <EmDashLabel>Stadseditie</EmDashLabel>
          <h1 className={styles.title}>
            {trade.namePlural} in <em className={styles.italic}>{city.name}</em>.
          </h1>
          <p className={styles.lede}>
            {formatNL(stats.count)} KvK-geverifieerde {trade.namePlural.toLowerCase()} in en rond{' '}
            {city.name}.
          </p>
          <dl className={styles.statsRow}>
            <div>
              <dt className="label label-muted">In de gids</dt>
              <dd className={styles.statValue}>{formatNL(stats.count)}</dd>
            </div>
            <div>
              <dt className="label label-muted">Gem. beoordeling</dt>
              <dd className={styles.statValue}>
                {stats.avgRating != null ? `${stats.avgRating.toFixed(1)}★` : '—'}
              </dd>
            </div>
            <div>
              <dt className="label label-muted">Provincie</dt>
              <dd className={styles.statValue}>{city.province}</dd>
            </div>
          </dl>
        </header>
      </Container>

      <Rule variant="thick" />

      {/* ── Filters + Sortering (URL-state, geen JS nodig) ─────────────── */}
      <Container>
        <section className={styles.filterBar}>
          <form method="get" className={styles.filterForm}>
            <fieldset className={styles.fieldset}>
              <legend className="label label-muted">Beschikbaarheid</legend>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  name="beschikbaar"
                  value="AVAILABLE_NOW"
                  defaultChecked={filters.availability?.includes('AVAILABLE_NOW')}
                />{' '}
                Nu
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  name="beschikbaar"
                  value="AVAILABLE_THIS_WEEK"
                  defaultChecked={filters.availability?.includes('AVAILABLE_THIS_WEEK')}
                />{' '}
                Deze week
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  name="beschikbaar"
                  value="AVAILABLE_THIS_MONTH"
                  defaultChecked={filters.availability?.includes('AVAILABLE_THIS_MONTH')}
                />{' '}
                Deze maand
              </label>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend className="label label-muted">Min. beoordeling</legend>
              <select name="rating" defaultValue={sp.rating ?? ''} className={styles.select}>
                <option value="">Alle</option>
                <option value="3">3★ of hoger</option>
                <option value="4">4★ of hoger</option>
                <option value="4.5">4.5★ of hoger</option>
              </select>
            </fieldset>

            {specialties.length > 0 && (
              <fieldset className={styles.fieldset}>
                <legend className="label label-muted">Specialisme</legend>
                <select
                  name="specialisme"
                  defaultValue={sp.specialisme ?? ''}
                  className={styles.select}
                >
                  <option value="">Alle</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </fieldset>
            )}

            <fieldset className={styles.fieldset}>
              <legend className="label label-muted">Sorteer op</legend>
              <select name="sort" defaultValue={sort} className={styles.select}>
                <option value="quality">Relevantie (kwaliteit)</option>
                <option value="rating">Beoordeling</option>
                <option value="recent">Recent toegevoegd</option>
              </select>
            </fieldset>

            <div className={styles.filterActions}>
              <button type="submit" className={styles.applyBtn}>
                Toepassen
              </button>
              {hasFilters && (
                <Link href={`/${trade.slug}/${city.slug}`} className={styles.resetLink}>
                  Wissen
                </Link>
              )}
            </div>
          </form>
        </section>
      </Container>

      <Rule variant="soft" />

      {/* ── Resultaten ────────────────────────────────────────────────────── */}
      <Container>
        <section className={styles.results}>
          <header className={styles.resultsHead}>
            <span className="label label-muted">
              {hasFilters
                ? `${formatNL(totalCount)} van ${formatNL(stats.count)} resultaten`
                : `${formatNL(totalCount)} resultaten`}
            </span>
            {totalPages > 1 && (
              <span className="label label-muted">
                Pagina {page} van {totalPages}
              </span>
            )}
          </header>

          {results.length === 0 ? (
            <div className={styles.empty}>
              <p className="muted">
                Geen {trade.namePlural.toLowerCase()} gevonden in {city.name} met deze filters.
              </p>
              {hasFilters && (
                <Link href={`/${trade.slug}/${city.slug}`} className={styles.allLink}>
                  Filters wissen →
                </Link>
              )}
            </div>
          ) : (
            <ul className={styles.resultList}>
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
          )}

          {/* Paginering */}
          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Paginering">
              {page > 1 && (
                <Link
                  href={{
                    pathname: `/${trade.slug}/${city.slug}`,
                    query: { ...sp, pagina: page - 1 },
                  }}
                  className={styles.pageLink}
                >
                  ← Vorige
                </Link>
              )}
              <span className={styles.pageMeta}>
                Pagina {page} van {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={{
                    pathname: `/${trade.slug}/${city.slug}`,
                    query: { ...sp, pagina: page + 1 },
                  }}
                  className={styles.pageLink}
                >
                  Volgende →
                </Link>
              )}
            </nav>
          )}
        </section>
      </Container>

      <Rule variant="thick" />

      {/* ── Lokale content (uniek per stad-vak) ─────────────────────────── */}
      <Container>
        <section className={styles.lokaal}>
          <EmDashLabel variant="muted">Over deze stad</EmDashLabel>
          <h2 className={`serif ${styles.h2}`}>
            {trade.namePlural} <em className={styles.italic}>in {city.name}</em>
          </h2>
          <p className={styles.lokaalBody}>{lokaalParagraaf}</p>
          <p className={styles.lokaalBody}>
            Het {city.province} kent {trade.namePlural.toLowerCase()} met uiteenlopende
            specialisaties — van kleine reparaties tot complete renovaties. Vergelijk tarieven,
            beoordelingen en certificeringen via de gids om de best passende vakman te vinden.
          </p>
        </section>
      </Container>

      {/* ── Gerelateerde vakgebieden in dezelfde stad ───────────────────── */}
      {relatedTrades.length > 0 && (
        <>
          <Rule variant="soft" />
          <Container>
            <section className={styles.related}>
              <EmDashLabel>Andere vakgebieden in {city.name}</EmDashLabel>
              <ul className={styles.relatedList}>
                {relatedTrades.map((t) => (
                  <li key={t.id}>
                    <Link href={`/${t.slug}/${city.slug}`} className={styles.relatedLink}>
                      <span className={`serif ${styles.relatedName}`}>{t.namePlural}</span>
                      <span className="muted text-sm">({formatNL(t.count)})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </Container>
        </>
      )}

      {/* ── Naburige steden ───────────────────────────────────────────────── */}
      {nearbyCities.length > 0 && (
        <>
          <Rule variant="soft" />
          <Container>
            <section className={styles.related}>
              <EmDashLabel>{trade.namePlural} in nabij­gelegen steden</EmDashLabel>
              <ul className={styles.relatedList}>
                {nearbyCities.map((c) => (
                  <li key={c.id}>
                    <Link href={`/${trade.slug}/${c.slug}`} className={styles.relatedLink}>
                      <span className={`serif ${styles.relatedName}`}>
                        {trade.namePlural} in {c.name}
                      </span>
                      <span className="muted text-sm">({c.distanceKm} km)</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </Container>
        </>
      )}
    </>
  )
}
