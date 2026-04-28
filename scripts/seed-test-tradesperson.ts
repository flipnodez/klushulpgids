/**
 * Eenmalig seed-script voor een test-vakman zodat de founder het dashboard
 * end-to-end kan testen via de claim-flow.
 *
 * Run lokaal:        npm run seed:test-tradesperson
 * Run op Scalingo:   scalingo --app klushulpgids run --detached -- npx tsx scripts/seed-test-tradesperson.ts
 *
 * Idempotent — bij her-run wordt een bestaand testprofiel teruggezet naar
 * `profileClaimed: false` zodat je de claim-flow opnieuw kunt doorlopen.
 */

import { PrismaClient } from '@prisma/client'

import { encrypt, hashEmail } from '../lib/encryption'

const prisma = new PrismaClient()

const TEST = {
  companyName: 'Zeker Verduurzamen',
  slug: 'zeker-verduurzamen-diemen',
  kvkNumber: '90909090',
  email: 'info@zekerverduurzamen.nl',
  cityName: 'Diemen',
  tradeSlug: 'cv-monteurs',
}

async function main() {
  let city = await prisma.city.findFirst({ where: { name: TEST.cityName } })
  if (!city) {
    console.log(`↻ City "${TEST.cityName}" niet gevonden — wordt aangemaakt`)
    city = await prisma.city.create({
      data: {
        name: TEST.cityName,
        slug: 'diemen',
        province: 'Noord-Holland',
        latitude: 52.3393,
        longitude: 4.9615,
        population: 31000,
      },
    })
    console.log(`✓ Diemen aangemaakt: ${city.id}`)
  }

  const trade = await prisma.trade.findFirst({ where: { slug: TEST.tradeSlug } })
  if (!trade) {
    console.error(`✗ Trade "${TEST.tradeSlug}" niet gevonden`)
    process.exit(1)
  }

  const emailHashed = hashEmail(TEST.email)
  const emailEncrypted = encrypt(TEST.email)

  const baseData = {
    companyName: TEST.companyName,
    slug: TEST.slug,
    kvkNumber: TEST.kvkNumber,
    cityId: city.id,
    email: emailEncrypted,
    emailHash: emailHashed,
    profileClaimed: false,
    profileClaimedAt: null,
    profileActive: true,
    description:
      'Specialist in warmtepompen, isolatie en zonnepanelen. Wij helpen Diemense ' +
      'huiseigenaren met de verduurzaming van hun woning. Persoonlijk advies, ' +
      'eigen monteurs, geen onderaannemers.',
    phone: '020 123 4567',
    websiteUrl: 'https://zekerverduurzamen.nl',
    hourlyRateMin: 65,
    hourlyRateMax: 95,
    teamSize: 'SMALL' as const,
    marketFocus: 'B2C' as const,
    foundedYear: 2018,
    qualityScore: 85,
    availabilityStatus: 'AVAILABLE_THIS_WEEK' as const,
    availabilityUpdatedAt: new Date(),
    kvkVerified: true,
    kvkVerifiedAt: new Date(),
    emergencyService: false,
    specialties: ['warmtepompen', 'isolatie', 'zonnepanelen'],
    sourcesUsed: ['manual_test'],
  }

  // Idempotent — match op KvK / slug / emailHash
  const existing = await prisma.tradesperson.findFirst({
    where: {
      OR: [{ kvkNumber: TEST.kvkNumber }, { slug: TEST.slug }, { emailHash: emailHashed }],
    },
  })

  if (existing) {
    console.log(`↻ Reset bestaande test-tradesperson: ${existing.id} (${existing.companyName})`)
    await prisma.tradesperson.update({
      where: { id: existing.id },
      data: baseData,
    })
    await prisma.tradespersonTrade.deleteMany({ where: { tradespersonId: existing.id } })
    await prisma.tradespersonTrade.create({
      data: { tradespersonId: existing.id, tradeId: trade.id, isPrimary: true },
    })
    console.log(`✓ Reset — slug: /vakman/${TEST.slug}`)
  } else {
    const tp = await prisma.tradesperson.create({ data: baseData })
    await prisma.tradespersonTrade.create({
      data: { tradespersonId: tp.id, tradeId: trade.id, isPrimary: true },
    })
    console.log(`✓ Aangemaakt — id ${tp.id}, slug: /vakman/${TEST.slug}`)
  }

  console.log('\n→ Test de claim-flow:')
  console.log('   1. Bezoek https://klushulpgids.nl/voor-vakmensen/claim')
  console.log(`   2. Vul KvK in: ${TEST.kvkNumber}`)
  console.log(`   3. Magic-link gaat naar ${TEST.email}`)
  console.log('   4. Klik link → land op /dashboard/welkom?claim=...\n')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
