import { PrismaClient } from '@prisma/client'

import { cities } from './seed-data/cities'
import { trades } from './seed-data/trades'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Klushulpgids.nl…\n')

  // ── Trades ──────────────────────────────────────────────────────────────
  console.log(`Trades: ${trades.length} te seeden`)
  let tradesCreated = 0
  let tradesUpdated = 0
  for (const t of trades) {
    const existing = await prisma.trade.findUnique({ where: { slug: t.slug } })
    await prisma.trade.upsert({
      where: { slug: t.slug },
      create: t,
      update: t,
    })
    if (existing) tradesUpdated++
    else tradesCreated++
  }
  console.log(`  → ${tradesCreated} nieuw, ${tradesUpdated} geüpdate`)

  // ── Cities ──────────────────────────────────────────────────────────────
  console.log(`\nCities: ${cities.length} te seeden`)
  let citiesCreated = 0
  let citiesUpdated = 0
  for (const c of cities) {
    const existing = await prisma.city.findUnique({ where: { slug: c.slug } })
    await prisma.city.upsert({
      where: { slug: c.slug },
      create: c,
      update: c,
    })
    if (existing) citiesUpdated++
    else citiesCreated++
  }
  console.log(`  → ${citiesCreated} nieuw, ${citiesUpdated} geüpdate`)

  // ── Sanity-check ────────────────────────────────────────────────────────
  const tradeCount = await prisma.trade.count()
  const cityCount = await prisma.city.count()
  console.log(`\n✅ Database state: ${tradeCount} trades, ${cityCount} cities`)
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
