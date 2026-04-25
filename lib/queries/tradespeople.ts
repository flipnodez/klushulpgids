import 'server-only'

import type { Prisma } from '@prisma/client'

import { prisma } from '../db'

/**
 * Tradesperson queries — server-side only.
 * Geen email-decryption hier; dat gebeurt expliciet bij dashboards (fase 6),
 * niet in de publieke listings.
 */

const PUBLIC_SELECT = {
  id: true,
  slug: true,
  companyName: true,
  contactName: true,
  description: true,
  phone: true,
  websiteUrl: true,
  socialMedia: true,
  street: true,
  houseNumber: true,
  postalCode: true,
  cityId: true,
  city: { select: { id: true, slug: true, name: true, province: true } },
  latitude: true,
  longitude: true,
  hourlyRateMin: true,
  hourlyRateMax: true,
  yearsExperience: true,
  foundedYear: true,
  teamSize: true,
  marketFocus: true,
  emergencyService: true,
  availabilityStatus: true,
  availabilityUpdatedAt: true,
  responseTime: true,
  specialties: true,
  profileClaimed: true,
  kvkVerified: true,
  ratingAvg: true,
  ratingCount: true,
  googleRating: true,
  googleReviewsCount: true,
  tier: true,
  featured: true,
  qualityScore: true,
  trades: {
    select: {
      isPrimary: true,
      trade: {
        select: { id: true, slug: true, nameSingular: true, namePlural: true, iconName: true },
      },
    },
  },
  certifications: {
    select: {
      certification: { select: { id: true, slug: true, name: true } },
    },
  },
  industryAssociations: {
    select: {
      association: { select: { id: true, slug: true, name: true, url: true } },
    },
  },
  reviewSources: {
    select: { id: true, platform: true, url: true, rating: true, reviewCount: true },
  },
  photos: {
    where: {},
    orderBy: { displayOrder: 'asc' as const },
    select: { id: true, url: true, altText: true, isCover: true, displayOrder: true },
  },
} satisfies Prisma.TradespersonSelect

export type PublicTradesperson = Prisma.TradespersonGetPayload<{ select: typeof PUBLIC_SELECT }>

export type SortOption = 'quality' | 'rating' | 'recent'

export type TradespersonFilters = {
  /** Beschikbaarheid filter; `[]` = geen filter */
  availability?: Array<'AVAILABLE_NOW' | 'AVAILABLE_THIS_WEEK' | 'AVAILABLE_THIS_MONTH'>
  /** Min. rating (op een schaal van 0-5) */
  minRating?: number
  /** Specialisatie zoekterm — moet in `specialties` array voorkomen */
  specialty?: string
}

const SORT_TO_ORDER_BY: Record<SortOption, Prisma.TradespersonOrderByWithRelationInput[]> = {
  quality: [
    { featured: 'desc' },
    { boostScore: 'desc' },
    { qualityScore: 'desc' },
    { ratingAvg: { sort: 'desc', nulls: 'last' } },
    { ratingCount: 'desc' },
  ],
  rating: [
    { ratingAvg: { sort: 'desc', nulls: 'last' } },
    { ratingCount: 'desc' },
    { qualityScore: 'desc' },
  ],
  recent: [{ scrapedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
}

function buildFilterWhere(filters?: TradespersonFilters): Prisma.TradespersonWhereInput {
  const where: Prisma.TradespersonWhereInput = {}
  if (filters?.availability && filters.availability.length > 0) {
    where.availabilityStatus = { in: filters.availability }
  }
  if (filters?.minRating != null && filters.minRating > 0) {
    where.ratingAvg = { gte: filters.minRating }
  }
  if (filters?.specialty) {
    where.specialties = { has: filters.specialty }
  }
  return where
}

/**
 * Vakmensen voor een specifiek vak in een specifieke stad.
 * Default sortering: featured → boost → quality → ratingAvg.
 */
export async function getTradespeopleByVakAndCity(
  vakSlug: string,
  citySlug: string,
  opts: {
    take?: number
    skip?: number
    sort?: SortOption
    filters?: TradespersonFilters
  } = {},
): Promise<PublicTradesperson[]> {
  const { take = 20, skip = 0, sort = 'quality', filters } = opts

  return prisma.tradesperson.findMany({
    where: {
      ...buildFilterWhere(filters),
      city: { slug: citySlug },
      trades: { some: { trade: { slug: vakSlug } } },
    },
    select: PUBLIC_SELECT,
    orderBy: SORT_TO_ORDER_BY[sort],
    take,
    skip,
  })
}

export async function getTradespersonBySlug(slug: string): Promise<PublicTradesperson | null> {
  return prisma.tradesperson.findUnique({
    where: { slug },
    select: PUBLIC_SELECT,
  })
}

export async function getFeaturedTradespeople(
  cityId: string,
  tradeId: string,
  limit = 3,
): Promise<PublicTradesperson[]> {
  return prisma.tradesperson.findMany({
    where: {
      cityId,
      featured: true,
      trades: { some: { tradeId } },
    },
    select: PUBLIC_SELECT,
    orderBy: [{ boostScore: 'desc' }, { qualityScore: 'desc' }],
    take: limit,
  })
}

/**
 * Top-vakmensen op rating + quality score, voor de homepage "drie uit de gids".
 * Accepteert zowel `ratingAvg` (eigen reviews) als `googleRating` (extern) —
 * vóór fase 7 zijn er nog geen eigen reviews dus googleRating is de bron.
 */
export async function getTopTradespeople(limit = 3): Promise<PublicTradesperson[]> {
  return prisma.tradesperson.findMany({
    where: {
      OR: [{ ratingAvg: { not: null } }, { googleRating: { not: null } }],
      qualityScore: { gte: 50 },
    },
    select: PUBLIC_SELECT,
    orderBy: [
      { ratingAvg: { sort: 'desc', nulls: 'last' } },
      { googleRating: { sort: 'desc', nulls: 'last' } },
      { qualityScore: 'desc' },
      { ratingCount: 'desc' },
    ],
    take: limit,
  })
}

/**
 * Top-vakmensen voor een vak (over alle steden).
 */
export async function getTopTradespeopleByTrade(
  tradeId: string,
  limit = 6,
): Promise<PublicTradesperson[]> {
  return prisma.tradesperson.findMany({
    where: {
      trades: { some: { tradeId } },
      qualityScore: { gte: 30 },
    },
    select: PUBLIC_SELECT,
    orderBy: [{ qualityScore: 'desc' }, { ratingAvg: { sort: 'desc', nulls: 'last' } }],
    take: limit,
  })
}

export async function getRelatedTradespeople(
  cityId: string,
  tradeId: string,
  excludeId: string,
  limit = 4,
): Promise<PublicTradesperson[]> {
  return prisma.tradesperson.findMany({
    where: {
      cityId,
      trades: { some: { tradeId } },
      id: { not: excludeId },
    },
    select: PUBLIC_SELECT,
    orderBy: [{ qualityScore: 'desc' }, { ratingAvg: { sort: 'desc', nulls: 'last' } }],
    take: limit,
  })
}

export async function searchTradespeople(query: string, take = 20): Promise<PublicTradesperson[]> {
  const q = query.trim()
  if (q.length < 2) return []
  return prisma.tradesperson.findMany({
    where: {
      OR: [
        { companyName: { contains: q, mode: 'insensitive' } },
        { specialties: { hasSome: [q.toLowerCase()] } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: PUBLIC_SELECT,
    orderBy: [{ qualityScore: 'desc' }, { ratingAvg: { sort: 'desc', nulls: 'last' } }],
    take,
  })
}

export async function countTradespeopleByVakAndCity(
  vakSlug: string,
  citySlug: string,
  filters?: TradespersonFilters,
): Promise<number> {
  return prisma.tradesperson.count({
    where: {
      ...buildFilterWhere(filters),
      city: { slug: citySlug },
      trades: { some: { trade: { slug: vakSlug } } },
    },
  })
}

export async function countTradespeopleByVak(vakSlug: string): Promise<number> {
  return prisma.tradesperson.count({
    where: { trades: { some: { trade: { slug: vakSlug } } } },
  })
}

export async function countTradespeopleByCity(citySlug: string): Promise<number> {
  return prisma.tradesperson.count({ where: { city: { slug: citySlug } } })
}

/**
 * Aggregaat-stats per stad voor één vak — voor "Loodgieters in Amsterdam"-hero.
 */
export async function getVakCityStats(
  vakSlug: string,
  citySlug: string,
): Promise<{ count: number; avgRating: number | null; lastUpdate: Date | null }> {
  const [count, agg] = await Promise.all([
    countTradespeopleByVakAndCity(vakSlug, citySlug),
    prisma.tradesperson.aggregate({
      where: {
        city: { slug: citySlug },
        trades: { some: { trade: { slug: vakSlug } } },
      },
      _avg: { ratingAvg: true },
      _max: { scrapedAt: true },
    }),
  ])
  return {
    count,
    avgRating: agg._avg.ratingAvg ?? null,
    lastUpdate: agg._max.scrapedAt ?? null,
  }
}

/**
 * Unieke specialisaties die in een vak×stad combinatie voorkomen.
 * Voor het filter-pulldown in de vak/stad-pagina.
 */
export async function getSpecialtiesForVakAndCity(
  vakSlug: string,
  citySlug: string,
): Promise<string[]> {
  const rows = await prisma.tradesperson.findMany({
    where: {
      city: { slug: citySlug },
      trades: { some: { trade: { slug: vakSlug } } },
    },
    select: { specialties: true },
  })
  const all = new Set<string>()
  for (const r of rows) {
    for (const s of r.specialties) all.add(s)
  }
  return [...all].sort((a, b) => a.localeCompare(b, 'nl'))
}
