import 'server-only'

import type { Prisma } from '@prisma/client'

import { prisma } from '../db'

const TRADE_SELECT = {
  id: true,
  slug: true,
  nameSingular: true,
  namePlural: true,
  description: true,
  iconName: true,
  seoTitleTemplate: true,
  seoDescriptionTemplate: true,
} satisfies Prisma.TradeSelect

export type PublicTrade = Prisma.TradeGetPayload<{ select: typeof TRADE_SELECT }>

export async function getAllTrades(): Promise<PublicTrade[]> {
  return prisma.trade.findMany({
    select: TRADE_SELECT,
    orderBy: { namePlural: 'asc' },
  })
}

/**
 * Alle vakgebieden met aantal vakmensen per vak. Voor de homepage-grid.
 */
export async function getAllTradesWithCount(): Promise<Array<PublicTrade & { count: number }>> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      slug: string
      nameSingular: string
      namePlural: string
      description: string
      iconName: string
      seoTitleTemplate: string
      seoDescriptionTemplate: string
      count: bigint
    }>
  >`
    SELECT t.id, t.slug, t."nameSingular", t."namePlural", t.description, t."iconName",
           t."seoTitleTemplate", t."seoDescriptionTemplate",
           COUNT(DISTINCT tt."tradespersonId") AS count
    FROM "Trade" t
    LEFT JOIN "TradespersonTrade" tt ON tt."tradeId" = t.id
    GROUP BY t.id
    ORDER BY t."namePlural" ASC
  `
  return rows.map((r) => ({
    ...r,
    count: Number(r.count),
  }))
}

export async function getTradeBySlug(slug: string): Promise<PublicTrade | null> {
  return prisma.trade.findUnique({ where: { slug }, select: TRADE_SELECT })
}

/**
 * Andere vakgebieden in dezelfde stad — voor "Andere vakmensen in Amsterdam".
 */
export async function getRelatedTradesInCity(
  cityId: string,
  excludeTradeId: string,
  limit = 6,
): Promise<Array<PublicTrade & { count: number }>> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      slug: string
      nameSingular: string
      namePlural: string
      description: string
      iconName: string
      seoTitleTemplate: string
      seoDescriptionTemplate: string
      count: bigint
    }>
  >`
    SELECT t.id, t.slug, t."nameSingular", t."namePlural", t.description, t."iconName",
           t."seoTitleTemplate", t."seoDescriptionTemplate",
           COUNT(DISTINCT tt."tradespersonId") AS count
    FROM "Trade" t
    JOIN "TradespersonTrade" tt ON tt."tradeId" = t.id
    JOIN "Tradesperson" tp ON tp.id = tt."tradespersonId"
    WHERE tp."cityId" = ${cityId}
      AND t.id != ${excludeTradeId}
    GROUP BY t.id
    HAVING COUNT(DISTINCT tt."tradespersonId") > 0
    ORDER BY count DESC
    LIMIT ${limit}
  `
  return rows.map((r) => ({
    ...r,
    count: Number(r.count),
  }))
}

/**
 * Vakgebieden uitgevoerd in een specifieke stad (voor /plaats/[stad]).
 */
export async function getTradesInCity(
  citySlug: string,
): Promise<Array<PublicTrade & { count: number }>> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      slug: string
      nameSingular: string
      namePlural: string
      description: string
      iconName: string
      seoTitleTemplate: string
      seoDescriptionTemplate: string
      count: bigint
    }>
  >`
    SELECT t.id, t.slug, t."nameSingular", t."namePlural", t.description, t."iconName",
           t."seoTitleTemplate", t."seoDescriptionTemplate",
           COUNT(DISTINCT tt."tradespersonId") AS count
    FROM "Trade" t
    LEFT JOIN "TradespersonTrade" tt ON tt."tradeId" = t.id
    LEFT JOIN "Tradesperson" tp ON tp.id = tt."tradespersonId"
    LEFT JOIN "City" c ON c.id = tp."cityId"
    WHERE c.slug = ${citySlug}
    GROUP BY t.id
    ORDER BY count DESC
  `
  return rows.map((r) => ({
    ...r,
    count: Number(r.count),
  }))
}
