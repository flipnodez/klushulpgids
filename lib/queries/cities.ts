import 'server-only'

import type { Prisma } from '@prisma/client'

import { prisma } from '../db'

const CITY_SELECT = {
  id: true,
  slug: true,
  name: true,
  province: true,
  latitude: true,
  longitude: true,
  population: true,
} satisfies Prisma.CitySelect

export type PublicCity = Prisma.CityGetPayload<{ select: typeof CITY_SELECT }>

export async function getAllCities(): Promise<PublicCity[]> {
  return prisma.city.findMany({
    select: CITY_SELECT,
    orderBy: [{ population: 'desc' }, { name: 'asc' }],
  })
}

export async function getTopCities(limit = 12): Promise<PublicCity[]> {
  return prisma.city.findMany({
    select: CITY_SELECT,
    orderBy: { population: 'desc' },
    take: limit,
  })
}

export async function getCityBySlug(slug: string): Promise<PublicCity | null> {
  return prisma.city.findUnique({ where: { slug }, select: CITY_SELECT })
}

/**
 * Probeer een stad te vinden op basis van vrije input. Tolerantie voor
 * "Amsterdam", "amsterdam", "AMSTERDAM", "Den Haag" → "den-haag", etc.
 *
 * 1. Exacte slug match
 * 2. Case-insensitive contains op City.name
 */
export async function resolveCityFromInput(input: string): Promise<PublicCity | null> {
  const trimmed = input.trim()
  if (trimmed.length < 2) return null

  const slug = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const direct = await prisma.city.findUnique({ where: { slug }, select: CITY_SELECT })
  if (direct) return direct

  return prisma.city.findFirst({
    where: { name: { contains: trimmed, mode: 'insensitive' } },
    select: CITY_SELECT,
    orderBy: { population: 'desc' },
  })
}

export async function getCitiesByProvince(province: string): Promise<PublicCity[]> {
  return prisma.city.findMany({
    where: { province },
    select: CITY_SELECT,
    orderBy: { population: 'desc' },
  })
}

export async function getProvinces(): Promise<string[]> {
  const rows = await prisma.city.findMany({
    select: { province: true },
    distinct: ['province'],
    orderBy: { province: 'asc' },
  })
  return rows.map((r) => r.province)
}

/**
 * Top steden waar dit vakgebied is uitgevoerd, met counts. Voor het
 * vakgebied-overzicht ("Loodgieters in Amsterdam (412)").
 */
export async function getCitiesWithTradeCount(
  tradeSlug: string,
  limit = 30,
): Promise<Array<PublicCity & { count: number }>> {
  // Prisma ondersteunt geen groupBy met city-relatie direct, dus we doen
  // een raw GROUP BY query op de Tradesperson tabel.
  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      slug: string
      name: string
      province: string
      latitude: number
      longitude: number
      population: number
      count: bigint
    }>
  >`
    SELECT c.id, c.slug, c.name, c.province, c.latitude, c.longitude, c.population,
           COUNT(t.id) AS count
    FROM "City" c
    JOIN "Tradesperson" t ON t."cityId" = c.id
    JOIN "TradespersonTrade" tt ON tt."tradespersonId" = t.id
    JOIN "Trade" tr ON tr.id = tt."tradeId"
    WHERE tr.slug = ${tradeSlug}
    GROUP BY c.id
    ORDER BY count DESC, c.population DESC
    LIMIT ${limit}
  `
  return rows.map((r) => ({
    ...r,
    count: Number(r.count),
  }))
}

/**
 * Naburige steden: zelfde provincie, gesorteerd op afstand vanaf gegeven city.
 * Gebruikt grootcirkel-afstand via Postgres trigonometrie (geen extension nodig).
 */
export async function getNearbyCities(
  city: PublicCity,
  limit = 6,
): Promise<Array<PublicCity & { distanceKm: number }>> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      slug: string
      name: string
      province: string
      latitude: number
      longitude: number
      population: number
      distance_km: number
    }>
  >`
    SELECT id, slug, name, province, latitude, longitude, population,
      ROUND(
        (6371 * acos(
          GREATEST(-1, LEAST(1,
            cos(radians(${city.latitude})) * cos(radians(latitude))
            * cos(radians(longitude) - radians(${city.longitude}))
            + sin(radians(${city.latitude})) * sin(radians(latitude))
          ))
        ))::numeric, 1
      ) AS distance_km
    FROM "City"
    WHERE id != ${city.id}
      AND province = ${city.province}
    ORDER BY distance_km ASC
    LIMIT ${limit}
  `
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    province: r.province,
    latitude: r.latitude,
    longitude: r.longitude,
    population: r.population,
    distanceKm: Number(r.distance_km),
  }))
}
