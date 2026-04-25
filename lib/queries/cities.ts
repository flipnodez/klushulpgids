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

export async function getCityBySlug(slug: string): Promise<PublicCity | null> {
  return prisma.city.findUnique({ where: { slug }, select: CITY_SELECT })
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
