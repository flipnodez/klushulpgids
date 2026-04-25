/**
 * Health-check script voor de database.
 * Run: npx tsx scripts/test-db.ts
 *
 * Output is een korte rapportage:
 *  1. Connectie + counts per tabel
 *  2. Sample query (top-10 vakmensen in Amsterdam)
 *  3. Encryption roundtrip test
 *  4. ✅ healthy / ❌ failed
 */

import { PrismaClient } from '@prisma/client'

import { decrypt, encrypt, hashEmail } from '../lib/encryption'

const prisma = new PrismaClient({ log: ['error'] })

const RULE = '─'.repeat(60)

async function main() {
  console.log(`\n${RULE}`)
  console.log('  Klushulpgids — database health check')
  console.log(RULE)

  // 1. Connection + version
  console.log('\n[1/5] Database connection')
  const versionRow = (await prisma.$queryRaw`SELECT version() as version`) as Array<{
    version: string
  }>
  const version = versionRow[0]?.version ?? '?'
  console.log(`     ✓ ${version.split(' ').slice(0, 2).join(' ')}`)

  // 2. Counts per tabel
  console.log('\n[2/5] Record counts')
  const [trades, cities, tradespeople, certifications, associations, reviews, blogPosts, users] =
    await Promise.all([
      prisma.trade.count(),
      prisma.city.count(),
      prisma.tradesperson.count(),
      prisma.certification.count(),
      prisma.industryAssociation.count(),
      prisma.review.count(),
      prisma.blogPost.count(),
      prisma.user.count(),
    ])
  const counts: Record<string, number> = {
    Trade: trades,
    City: cities,
    Tradesperson: tradespeople,
    Certification: certifications,
    IndustryAssociation: associations,
    Review: reviews,
    BlogPost: blogPosts,
    User: users,
  }
  for (const [name, count] of Object.entries(counts)) {
    console.log(`     ${name.padEnd(22)} ${count.toString().padStart(7)}`)
  }

  // 3. Sample query
  console.log('\n[3/5] Sample query — top-10 vakmensen in Amsterdam')
  const top = await prisma.tradesperson.findMany({
    where: { city: { slug: 'amsterdam' } },
    select: {
      companyName: true,
      qualityScore: true,
      googleRating: true,
      googleReviewsCount: true,
      trades: { select: { trade: { select: { nameSingular: true } } }, take: 1 },
    },
    orderBy: [{ qualityScore: 'desc' }, { ratingAvg: { sort: 'desc', nulls: 'last' } }],
    take: 10,
  })

  if (top.length === 0) {
    console.log('     (geen vakmensen in Amsterdam — DB nog niet geseed?)')
  } else {
    for (const t of top) {
      const trade = t.trades[0]?.trade.nameSingular ?? '—'
      const rating =
        t.googleRating != null
          ? `${t.googleRating.toFixed(1)}★ (${t.googleReviewsCount ?? 0})`
          : '—'
      console.log(
        `     [Q ${t.qualityScore.toString().padStart(3)}] ${t.companyName.slice(0, 40).padEnd(40)} ${trade.padEnd(14)} ${rating}`,
      )
    }
  }

  // 4. Encryption roundtrip
  console.log('\n[4/5] Encryption roundtrip')
  const sample = 'test@klushulpgids.nl'
  const enc = encrypt(sample)
  const dec = decrypt(enc)
  const hash = hashEmail(sample)
  if (dec !== sample) throw new Error(`Decrypt mismatch: ${dec} !== ${sample}`)
  if (!enc.match(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/)) {
    throw new Error(`Bad ciphertext format: ${enc}`)
  }
  if (!hash.match(/^[a-f0-9]{64}$/)) throw new Error(`Bad email hash: ${hash}`)
  console.log(`     ✓ encrypt/decrypt roundtrip on "${sample}"`)
  console.log(`       cipher: ${enc.slice(0, 60)}…`)
  console.log(`       hash:   ${hash.slice(0, 16)}…`)

  // 5. Index check (validatie dat unique constraints werken)
  console.log('\n[5/5] Schema constraints')
  if (trades > 0) {
    const t = await prisma.trade.findFirst()
    if (t) {
      try {
        await prisma.trade.create({
          data: {
            slug: t.slug, // duplicate slug → moet falen
            nameSingular: '__test',
            namePlural: '__test',
            description: '__test',
            iconName: '__test',
            seoTitleTemplate: '__test',
            seoDescriptionTemplate: '__test',
          },
        })
        throw new Error('Unique constraint not enforced on Trade.slug!')
      } catch (err) {
        if (err instanceof Error && err.message.includes('Unique constraint')) {
          console.log(`     ✓ unique(Trade.slug) enforced`)
        } else {
          throw err
        }
      }
    }
  } else {
    console.log('     (skipped — geen trades)')
  }

  console.log(`\n${RULE}`)
  console.log('  ✅ Database is healthy')
  console.log(`${RULE}\n`)
}

main()
  .catch((err) => {
    console.error('\n❌ Health check failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
