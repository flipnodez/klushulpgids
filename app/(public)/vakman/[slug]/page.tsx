import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { ReviewCard } from '@/components/features/review/ReviewCard'
import { AssociationList } from '@/components/features/tradesperson/AssociationList'
import { AvailabilityBadge } from '@/components/features/tradesperson/AvailabilityBadge'
import { CertificationList } from '@/components/features/tradesperson/CertificationList'
import { ContactBlock } from '@/components/features/tradesperson/ContactBlock'
import { TradespersonCard } from '@/components/features/tradesperson/TradespersonCard'
import { Container } from '@/components/ui/Container'
import { DropCap } from '@/components/ui/DropCap'
import { EmDashLabel } from '@/components/ui/EmDashLabel'
import { Rule } from '@/components/ui/Rule'
import { Stamp } from '@/components/ui/Stamp'
import { Stars } from '@/components/ui/Stars'
import { getApprovedReviews, getRelatedTradespeople, getTradespersonBySlug } from '@/lib/queries'

import styles from './page.module.css'

export const revalidate = 1800 // 30 min

type Params = { slug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const tp = await getTradespersonBySlug(slug)
  if (!tp) return {}

  const trade = tp.trades[0]?.trade
  const cityName = tp.city?.name
  const titleParts = [tp.companyName]
  if (trade) titleParts.push(`${trade.nameSingular}${cityName ? ` in ${cityName}` : ''}`)
  return {
    title: titleParts.join(' — '),
    description:
      tp.description?.slice(0, 160) ??
      `${tp.companyName}${cityName ? ` in ${cityName}` : ''} — beoordelingen, certificeringen en directe contactgegevens.`,
    alternates: { canonical: `/vakman/${tp.slug}` },
  }
}

function formatStartedYear(year: number | null | undefined): string | null {
  if (year == null) return null
  return `Sinds ${year}`
}

const TEAM_SIZE_LABELS = {
  SOLO: '1 persoon (ZZP)',
  SMALL: '2-4 medewerkers',
  MEDIUM: '5-10 medewerkers',
  LARGE: '10+ medewerkers',
} as const

export default async function VakmanProfilePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const tp = await getTradespersonBySlug(slug)
  if (!tp) notFound()

  const primaryTrade = tp.trades.find((t) => t.isPrimary)?.trade ?? tp.trades[0]?.trade

  const [reviews, related] = await Promise.all([
    getApprovedReviews(tp.id, { take: 20 }),
    primaryTrade && tp.cityId
      ? getRelatedTradespeople(tp.cityId, primaryTrade.id, tp.id, 4)
      : Promise.resolve([]),
  ])

  const displayRating = tp.ratingAvg ?? tp.googleRating
  const displayCount = tp.ratingAvg != null ? tp.ratingCount : tp.googleReviewsCount

  return (
    <>
      <Container>
        <div className={styles.crumbWrap}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              ...(primaryTrade
                ? [{ label: primaryTrade.namePlural, href: `/${primaryTrade.slug}` }]
                : []),
              ...(tp.city && primaryTrade
                ? [
                    {
                      label: tp.city.name,
                      href: `/${primaryTrade.slug}/${tp.city.slug}`,
                    },
                  ]
                : []),
              { label: tp.companyName },
            ]}
          />
        </div>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroMain}>
            {primaryTrade && tp.city && (
              <EmDashLabel variant="muted">
                {primaryTrade.nameSingular} · {tp.city.name}
              </EmDashLabel>
            )}
            <h1 className={styles.title}>
              {tp.companyName}
              {tp.city && (
                <>
                  {' '}
                  <em className={styles.italic}>in {tp.city.name}</em>
                </>
              )}
            </h1>

            <div className={styles.heroMeta}>
              {displayRating != null && (
                <Stars
                  rating={displayRating}
                  reviews={displayCount ?? undefined}
                  showNumber
                  size="lg"
                />
              )}
              {tp.availabilityStatus && tp.availabilityStatus !== 'UNKNOWN' && (
                <AvailabilityBadge
                  status={tp.availabilityStatus}
                  updatedAt={tp.availabilityUpdatedAt?.toISOString()}
                />
              )}
              {tp.kvkVerified && <Stamp>◆ KvK-geverifieerd</Stamp>}
            </div>

            <dl className={styles.stats}>
              {tp.kvkVerified && (
                <div>
                  <dt className="label label-muted">KvK</dt>
                  <dd className={styles.statVal}>Geverifieerd</dd>
                </div>
              )}
              {formatStartedYear(tp.foundedYear) && (
                <div>
                  <dt className="label label-muted">Opgericht</dt>
                  <dd className={styles.statVal}>{tp.foundedYear}</dd>
                </div>
              )}
              {tp.teamSize && (
                <div>
                  <dt className="label label-muted">Team</dt>
                  <dd className={styles.statVal}>{TEAM_SIZE_LABELS[tp.teamSize]}</dd>
                </div>
              )}
              {tp.responseTime && (
                <div>
                  <dt className="label label-muted">Reactietijd</dt>
                  <dd className={styles.statVal}>{tp.responseTime}</dd>
                </div>
              )}
            </dl>
          </div>

          <aside className={styles.heroAside}>
            <ContactBlock
              phone={tp.phone}
              email={null /* email is encrypted; fase 6 dashboard kan ontsluiten */}
              websiteUrl={tp.websiteUrl}
            />
          </aside>
        </section>
      </Container>

      <Rule variant="thick" />

      {/* ── Over ──────────────────────────────────────────────────────────── */}
      {tp.description && (
        <Container>
          <section className={styles.section}>
            <EmDashLabel>Over {tp.companyName}</EmDashLabel>
            <DropCap className={styles.body}>{tp.description}</DropCap>
          </section>
        </Container>
      )}

      {/* ── Specialisaties ─────────────────────────────────────────────── */}
      {tp.specialties.length > 0 && (
        <>
          <Rule variant="soft" />
          <Container>
            <section className={styles.section}>
              <EmDashLabel>Specialisaties</EmDashLabel>
              <p className={styles.specialties}>{tp.specialties.join(' · ')}</p>
            </section>
          </Container>
        </>
      )}

      {/* ── Certificeringen ──────────────────────────────────────────────── */}
      {tp.certifications.length > 0 && (
        <>
          <Rule variant="soft" />
          <Container>
            <CertificationList
              layout="list"
              items={tp.certifications.map((c) => c.certification)}
            />
          </Container>
        </>
      )}

      {/* ── Brancheverenigingen ─────────────────────────────────────────── */}
      {tp.industryAssociations.length > 0 && (
        <>
          <Rule variant="soft" />
          <Container>
            <section className={styles.section}>
              <EmDashLabel>Brancheverenigingen</EmDashLabel>
              <AssociationList
                items={tp.industryAssociations.map((a) => ({
                  id: a.association.id,
                  name: a.association.name,
                  url: a.association.url,
                }))}
              />
            </section>
          </Container>
        </>
      )}

      {/* ── Adres / Service-gebied ──────────────────────────────────────── */}
      {(tp.street || tp.city) && (
        <>
          <Rule variant="soft" />
          <Container>
            <section className={styles.section}>
              <EmDashLabel>Vestigingsadres</EmDashLabel>
              <address className={styles.address}>
                {tp.street && (
                  <div>
                    {tp.street}
                    {tp.houseNumber ? ` ${tp.houseNumber}` : ''}
                  </div>
                )}
                {tp.postalCode && tp.city && (
                  <div>
                    {tp.postalCode} {tp.city.name}
                  </div>
                )}
                {!tp.postalCode && tp.city && <div>{tp.city.name}</div>}
              </address>
            </section>
          </Container>
        </>
      )}

      {/* ── Externe reviews ─────────────────────────────────────────────── */}
      {tp.reviewSources.length > 0 && (
        <>
          <Rule variant="soft" />
          <Container>
            <section className={styles.section}>
              <EmDashLabel>Beoordelingen elders</EmDashLabel>
              <ul className={styles.reviewSources}>
                {tp.reviewSources.map((rs) => (
                  <li key={rs.id}>
                    <a
                      href={rs.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.reviewSourceLink}
                    >
                      <span className={`serif ${styles.reviewSourcePlatform}`}>{rs.platform}</span>
                      {rs.rating != null && (
                        <span className="muted text-sm">
                          {rs.rating.toFixed(1)}★{rs.reviewCount != null && ` (${rs.reviewCount})`}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </Container>
        </>
      )}

      {/* ── Eigen reviews ───────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <>
          <Rule variant="thick" />
          <Container>
            <section className={styles.section}>
              <EmDashLabel variant="accent">Reviews</EmDashLabel>
              <h2 className={`serif ${styles.h2}`}>Wat klanten zeggen.</h2>
              <div className={styles.reviewList}>
                {reviews.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={{
                      id: r.id,
                      reviewerName: r.reviewerName,
                      reviewerCity: r.reviewerCity,
                      rating: r.rating,
                      title: r.title,
                      body: r.body,
                      jobDate: r.jobDate,
                      createdAt: r.createdAt.toISOString(),
                      verificationMethod: r.verificationMethod,
                      ownerResponse: r.ownerResponse,
                      ownerResponseAt: r.ownerResponseAt?.toISOString(),
                      companyName: tp.companyName,
                    }}
                  />
                ))}
              </div>
            </section>
          </Container>
        </>
      )}

      {/* ── Hoe wij verifiëren ──────────────────────────────────────────── */}
      <Rule variant="thick" />
      <Container>
        <section className={styles.section}>
          <EmDashLabel variant="muted">Hoe wij verifiëren</EmDashLabel>
          <p className={styles.body}>
            Profielen worden gecontroleerd op KvK-registratie en — waar mogelijk — gestaafd met
            certificeringen en branche­verenigings­lidmaatschap. De vakman kan zijn profiel zelf
            claimen om gegevens bij te werken. Vragen of onnauwkeurigheden? Mail{' '}
            <a href="mailto:redactie@klushulpgids.nl">redactie@klushulpgids.nl</a>.
          </p>
        </section>
      </Container>

      {/* ── Andere vakmensen in dezelfde stad ──────────────────────────── */}
      {related.length > 0 && primaryTrade && tp.city && (
        <>
          <Rule variant="soft" />
          <Container>
            <section className={styles.section}>
              <EmDashLabel>
                Andere {primaryTrade.namePlural.toLowerCase()} in {tp.city.name}
              </EmDashLabel>
              <div className={styles.relatedGrid}>
                {related.map((r) => {
                  const rTrade = r.trades[0]?.trade
                  return (
                    <TradespersonCard
                      key={r.id}
                      data={{
                        slug: r.slug,
                        companyName: r.companyName,
                        cityName: r.city?.name,
                        tradeName: rTrade?.nameSingular,
                        foundedYear: r.foundedYear,
                        ratingAvg: r.ratingAvg,
                        ratingCount: r.ratingCount,
                        googleRating: r.googleRating,
                        googleReviewsCount: r.googleReviewsCount,
                        specialties: r.specialties,
                        availabilityStatus: r.availabilityStatus,
                        availabilityUpdatedAt: r.availabilityUpdatedAt?.toISOString(),
                        phone: r.phone,
                        tier: r.tier,
                      }}
                      href={`/vakman/${r.slug}`}
                    />
                  )
                })}
              </div>
              <Link href={`/${primaryTrade.slug}/${tp.city.slug}`} className={styles.allLink}>
                Alle {primaryTrade.namePlural.toLowerCase()} in {tp.city.name} →
              </Link>
            </section>
          </Container>
        </>
      )}
    </>
  )
}
