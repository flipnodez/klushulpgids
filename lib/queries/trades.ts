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

export async function getTradeBySlug(slug: string): Promise<PublicTrade | null> {
  return prisma.trade.findUnique({ where: { slug }, select: TRADE_SELECT })
}
