/**
 * Import-script voor scraped vakbedrijven-data.
 *
 * Bron: vakbedrijven_merged.json (11K records uit technieknl/bouwendnederland/etc).
 * Strategie:
 *  - Idempotent: re-runnen overschrijft niet, maar update bestaande records
 *    op (kvkNumber OR (sourceName, sourceId)).
 *  - Email versleuteld via lib/encryption.ts; emailHash voor lookup.
 *  - Trades gematcht via zoekterm + SBI-codes; cities op exacte slug-match.
 *  - Onbekende cities: cityId=null (gelogd), record blijft behouden.
 *  - Quality score 0-100 per criteria in phase-2-database.md §2.7.
 *
 * Run:
 *   npx tsx scripts/import-sample-data.ts                   # default = vakbedrijven_merged.json
 *   npx tsx scripts/import-sample-data.ts --file=foo.json   # custom file
 *   npx tsx scripts/import-sample-data.ts --limit=200       # stop na N records
 *   npx tsx scripts/import-sample-data.ts --dry-run         # geen DB-writes
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import { Prisma, PrismaClient, type AvailabilityStatus, type MarketFocus } from '@prisma/client'

import { encrypt, hashEmail } from '../lib/encryption'

const prisma = new PrismaClient({ log: ['error', 'warn'] })

// ============================================================================
// Type voor één raw record uit de JSON
// ============================================================================

type RawRecord = {
  bedrijfsnaam?: string
  plaats?: string
  straat?: string
  adres?: string
  postcode?: string
  email?: string
  telefoonnummer?: string
  website?: string
  beschrijving?: string
  marktfocus?: string
  certificeringen?: string[]
  brancheverenigingen?: string[]
  branchevereniging?: string
  specialisaties?: string[]
  social_media?: Record<string, unknown>
  google_reviews_count?: number
  google_reviews_score?: number
  google_place_id?: string
  review_url?: string
  review_bronnen?: Array<{ url?: string; bron?: string; rating?: number; aantal?: number }>
  zoekterm?: string
  sbi_codes?: Array<{ sbi_code?: string; sbi_naam?: string; score?: number; keywords?: string[] }>
  enrichment?: {
    kvk_nummer?: string
    btw_nummer?: string
    beschrijving?: string
  }
  relevantie?: string
  _source?: string
  _source_id?: string
  _sources?: string[]
  _source_ids?: string[]
  _fetched_at?: string
}

// ============================================================================
// CLI flags
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2)
  let file = 'vakbedrijven_merged.json'
  let limit: number | null = null
  let dryRun = false
  for (const a of args) {
    if (a.startsWith('--file=')) file = a.slice('--file='.length)
    else if (a.startsWith('--limit=')) limit = Number.parseInt(a.slice('--limit='.length), 10)
    else if (a === '--dry-run') dryRun = true
  }
  return { file, limit, dryRun }
}

// ============================================================================
// Trade matching: zoekterm + SBI → trade slug
// ============================================================================

const ZOEKTERM_TO_TRADE: Array<[RegExp, string]> = [
  [/^loodgieter/i, 'loodgieters'],
  [/^elektr/i, 'elektriciens'],
  [/^schilder/i, 'schilders'],
  [/^stukad/i, 'stukadoors'],
  [/^tegel/i, 'tegelzetters'],
  [/^timmer/i, 'timmerlieden'],
  [/^dakdekker|^dak\b/i, 'dakdekkers'],
  [/^hovenier/i, 'hoveniers'],
  [/^klus/i, 'klusbedrijven'],
  [/^cv\b|warmtepomp/i, 'cv-monteurs'],
  [/^glaszetter|^glas\b/i, 'glaszetters'],
  [/^vloer|parket/i, 'vloerenleggers'],
  [/^installat/i, 'klusbedrijven'], // generieke installatie → klusbedrijven (fallback)
]

const SBI_TO_TRADE: Record<string, string> = {
  '4321': 'elektriciens',
  '4322': 'loodgieters',
  '4322.1': 'cv-monteurs',
  '4322.2': 'loodgieters',
  '4329': 'klusbedrijven',
  '4331': 'stukadoors',
  '4332': 'timmerlieden',
  '4333': 'tegelzetters',
  '4334': 'schilders',
  '4339': 'klusbedrijven',
  '4391': 'dakdekkers',
  '4399': 'klusbedrijven',
  '8130': 'hoveniers',
  '81300': 'hoveniers',
}

function matchTrades(
  rec: RawRecord,
  tradeSlugById: Map<string, string>,
): {
  primary: string | null
  all: Array<{
    slug: string
    sbiCode?: string
    sbiName?: string
    sbiScore?: number
    isPrimary: boolean
  }>
} {
  const matches = new Map<
    string,
    { sbiCode?: string; sbiName?: string; sbiScore?: number; isPrimary: boolean }
  >()

  // 1. Zoekterm → primary trade
  let primary: string | null = null
  if (rec.zoekterm) {
    for (const [re, slug] of ZOEKTERM_TO_TRADE) {
      if (re.test(rec.zoekterm)) {
        primary = slug
        matches.set(slug, { isPrimary: true })
        break
      }
    }
  }

  // 2. SBI codes → additional trades (sorted by score desc)
  if (Array.isArray(rec.sbi_codes)) {
    const sorted = [...rec.sbi_codes].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    for (const sbi of sorted) {
      const code = sbi.sbi_code
      if (!code) continue
      // Try exact match first, then prefix (4322.1 → 4322)
      const slug = SBI_TO_TRADE[code] ?? SBI_TO_TRADE[code.split('.')[0] ?? '']
      if (!slug) continue
      if (!matches.has(slug)) {
        matches.set(slug, {
          sbiCode: code,
          sbiName: sbi.sbi_naam,
          sbiScore: sbi.score,
          isPrimary: !primary,
        })
        if (!primary) primary = slug
      } else {
        // Update SBI metadata on existing match
        const m = matches.get(slug)!
        if (!m.sbiCode) {
          m.sbiCode = code
          m.sbiName = sbi.sbi_naam
          m.sbiScore = sbi.score
        }
      }
    }
  }

  // 3. Filter: alleen trades die we kennen
  const all = [...matches.entries()]
    .filter(([slug]) => tradeSlugById.has(slug))
    .map(([slug, meta]) => ({ slug, ...meta }))

  return { primary: primary && tradeSlugById.has(primary) ? primary : null, all }
}

// ============================================================================
// Helpers
// ============================================================================

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function normalizeCitySlug(plaats: string): string {
  return slugify(plaats.replace(/^['s]\s*/i, 's-'))
}

function mapMarketFocus(value: string | undefined): MarketFocus | null {
  if (!value) return null
  const v = value.toUpperCase().replace(/\s/g, '')
  if (v === 'B2C') return 'B2C'
  if (v === 'B2B') return 'B2B'
  if (v === 'B2B+B2C' || v === 'B2C+B2B' || v === 'BOTH') return 'BOTH'
  return null
}

function inferAvailability(_rec: RawRecord): AvailabilityStatus {
  // Geen explicit availability in scrape data — alle import krijgt UNKNOWN.
  // Vakman update dit zelf in fase 6 dashboard.
  return 'UNKNOWN'
}

function calcQualityScore(rec: RawRecord): number {
  let score = 0
  if (rec.enrichment?.kvk_nummer) score += 20
  const desc = rec.beschrijving ?? rec.enrichment?.beschrijving ?? ''
  if (desc.length > 100) score += 10
  if (rec.telefoonnummer) score += 10
  if (rec.website) score += 10
  if (rec.email) score += 10
  if (Array.isArray(rec.certificeringen) && rec.certificeringen.length > 0) score += 15
  const associations =
    rec.brancheverenigingen ?? (rec.branchevereniging ? [rec.branchevereniging] : [])
  if (associations.length > 0) score += 10
  if ((rec.google_reviews_count ?? 0) > 5) score += 10
  if (Array.isArray(rec.specialisaties) && rec.specialisaties.length > 0) score += 5
  return Math.min(score, 100)
}

function uniqueSlug(used: Set<string>, base: string): string {
  let slug = base
  let i = 2
  while (used.has(slug)) {
    slug = `${base}-${i++}`
    if (i > 999) {
      slug = `${base}-${Date.now().toString(36)}`
      break
    }
  }
  used.add(slug)
  return slug
}

function parseAddress(rec: RawRecord): { street?: string; houseNumber?: string } {
  // "Past. van Haarenstraat 13" → street + houseNumber
  const src = rec.straat?.trim() || rec.adres?.split(',')[0]?.trim()
  if (!src) return {}
  const m = src.match(/^(.*?)\s+(\d+\s*[a-zA-Z]?)\s*$/)
  if (m) {
    return { street: m[1]?.trim(), houseNumber: m[2]?.replace(/\s/g, '') }
  }
  return { street: src }
}

// ============================================================================
// Stats
// ============================================================================

const stats = {
  total: 0,
  imported: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  noCityMatch: 0,
  noTradeMatch: 0,
  reasons: new Map<string, number>(),
}

function noteReason(reason: string) {
  stats.reasons.set(reason, (stats.reasons.get(reason) ?? 0) + 1)
}

// ============================================================================
// Hoofdimport
// ============================================================================

async function main() {
  const { file, limit, dryRun } = parseArgs()
  const filePath = resolve(process.cwd(), file)
  console.log(`📂 Reading ${filePath}…`)
  const raw = readFileSync(filePath, 'utf8')
  const records: RawRecord[] = JSON.parse(raw)
  console.log(`📊 ${records.length} records loaded`)
  if (limit) console.log(`   Limit: ${limit}`)
  if (dryRun) console.log(`   ⚠ DRY RUN — geen DB-writes`)

  // Pre-load lookup maps
  const trades = await prisma.trade.findMany({ select: { id: true, slug: true } })
  const tradeIdBySlug = new Map(trades.map((t) => [t.slug, t.id]))
  const tradeSlugById = new Map(trades.map((t) => [t.slug, t.slug]))
  console.log(`🛠️  ${trades.length} trades cached`)

  const cities = await prisma.city.findMany({ select: { id: true, slug: true } })
  const cityIdBySlug = new Map(cities.map((c) => [c.slug, c.id]))
  console.log(`🏙️  ${cities.length} cities cached`)

  // Track existing slugs voor uniciteit
  const existingSlugs = new Set(
    (await prisma.tradesperson.findMany({ select: { slug: true } })).map((t) => t.slug),
  )

  const toProcess = limit ? records.slice(0, limit) : records
  stats.total = toProcess.length

  const startTime = Date.now()

  for (let i = 0; i < toProcess.length; i++) {
    const rec = toProcess[i]!
    try {
      await importOne(rec, { tradeIdBySlug, tradeSlugById, cityIdBySlug, existingSlugs, dryRun })
    } catch (err) {
      stats.errors++
      const msg = err instanceof Error ? err.message : String(err)
      noteReason(`error: ${msg.slice(0, 100)}`)
      if (stats.errors < 5) {
        console.error(`  ❌ Record ${i} (${rec.bedrijfsnaam ?? '?'}): ${msg}`)
      }
    }

    if ((i + 1) % 250 === 0 || i === toProcess.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const rate = ((i + 1) / Number(elapsed)).toFixed(0)
      console.log(
        `  ${i + 1}/${toProcess.length}  imp=${stats.imported}  upd=${stats.updated}  skip=${stats.skipped}  err=${stats.errors}  (${elapsed}s, ${rate}/s)`,
      )
    }
  }

  // Final report
  console.log('\n────────────────────────────────────────')
  console.log(`✅ Total processed:    ${stats.total}`)
  console.log(`   Imported (new):     ${stats.imported}`)
  console.log(`   Updated:            ${stats.updated}`)
  console.log(`   Skipped:            ${stats.skipped}`)
  console.log(`   Errors:             ${stats.errors}`)
  console.log(`   No city match:      ${stats.noCityMatch}  (cityId set to NULL)`)
  console.log(`   No trade match:     ${stats.noTradeMatch}`)

  if (stats.reasons.size > 0) {
    console.log('\n   Skip/error reasons:')
    const sorted = [...stats.reasons.entries()].sort((a, b) => b[1] - a[1])
    for (const [reason, count] of sorted.slice(0, 10)) {
      console.log(`     ${count.toString().padStart(5)}  ${reason}`)
    }
  }

  console.log('────────────────────────────────────────\n')
}

// ============================================================================
// Eén record importeren
// ============================================================================

async function importOne(
  rec: RawRecord,
  ctx: {
    tradeIdBySlug: Map<string, string>
    tradeSlugById: Map<string, string>
    cityIdBySlug: Map<string, string>
    existingSlugs: Set<string>
    dryRun: boolean
  },
) {
  const companyName = rec.bedrijfsnaam?.trim()
  if (!companyName) {
    stats.skipped++
    noteReason('no companyName')
    return
  }

  const sourceName = rec._source ?? rec._sources?.[0]
  const sourceId = rec._source_id ?? rec._source_ids?.[0]
  if (!sourceName || !sourceId) {
    stats.skipped++
    noteReason('no source identifier')
    return
  }

  // Match trade
  const tradeMatch = matchTrades(rec, ctx.tradeSlugById)
  if (tradeMatch.all.length === 0) {
    stats.noTradeMatch++
    // Niet skippen — record blijft, alleen geen trade-link
  }

  // Match city
  let cityId: string | null = null
  if (rec.plaats) {
    const slug = normalizeCitySlug(rec.plaats)
    cityId = ctx.cityIdBySlug.get(slug) ?? null
    if (!cityId) stats.noCityMatch++
  } else {
    stats.noCityMatch++
  }

  // KvK & lookup
  const kvk = rec.enrichment?.kvk_nummer?.replace(/\s/g, '') || null
  const btw = rec.enrichment?.btw_nummer || null

  // Email + hash
  let emailEnc: string | null = null
  let emailHash: string | null = null
  if (rec.email) {
    const e = rec.email.trim().toLowerCase()
    if (e.includes('@')) {
      emailEnc = encrypt(e)
      emailHash = hashEmail(e)
    }
  }

  // Find existing record (idempotency)
  const existing = kvk
    ? await prisma.tradesperson.findUnique({ where: { kvkNumber: kvk } })
    : await prisma.tradesperson.findFirst({
        where: { sourceName, sourceId },
      })

  // Build data payload
  const description = (rec.beschrijving ?? rec.enrichment?.beschrijving ?? '')?.slice(0, 5000)
  const { street, houseNumber } = parseAddress(rec)
  const data = {
    companyName,
    kvkNumber: kvk,
    btwNumber: btw,
    description: description || null,
    email: emailEnc,
    emailHash,
    phone: rec.telefoonnummer || null,
    websiteUrl: rec.website || null,
    socialMedia: rec.social_media ? (rec.social_media as Prisma.InputJsonValue) : Prisma.JsonNull,
    street,
    houseNumber,
    postalCode: rec.postcode || null,
    cityId,
    marketFocus: mapMarketFocus(rec.marktfocus),
    availabilityStatus: inferAvailability(rec),
    specialties: Array.isArray(rec.specialisaties) ? rec.specialisaties : [],
    googleRating: rec.google_reviews_score ?? null,
    googleReviewsCount: rec.google_reviews_count ?? null,
    qualityScore: calcQualityScore(rec),
    sourcesUsed: rec._sources ?? (rec._source ? [rec._source] : []),
    sourceId,
    sourceName,
    privacySensitive: rec.relevantie === 'niet_relevant', // soft flag
    scrapedAt: rec._fetched_at ? new Date(rec._fetched_at) : null,
  }

  if (ctx.dryRun) {
    if (existing) stats.updated++
    else stats.imported++
    return
  }

  let tradesperson
  if (existing) {
    tradesperson = await prisma.tradesperson.update({
      where: { id: existing.id },
      data,
    })
    stats.updated++
  } else {
    const baseSlug = slugify(companyName)
    const slug = uniqueSlug(ctx.existingSlugs, baseSlug || `bedrijf-${sourceId}`)
    tradesperson = await prisma.tradesperson.create({
      data: { ...data, slug },
    })
    stats.imported++
  }

  // ── Trades (TradespersonTrade pivot) ────────────────────────────────────
  if (tradeMatch.all.length > 0) {
    // Wis bestaande pivots en herinsert (idempotent + cleanup oude matches)
    await prisma.tradespersonTrade.deleteMany({ where: { tradespersonId: tradesperson.id } })
    for (const m of tradeMatch.all) {
      const tradeId = ctx.tradeIdBySlug.get(m.slug)
      if (!tradeId) continue
      await prisma.tradespersonTrade.create({
        data: {
          tradespersonId: tradesperson.id,
          tradeId,
          isPrimary: m.isPrimary,
          sbiCode: m.sbiCode ?? null,
          sbiName: m.sbiName ?? null,
          sbiScore: m.sbiScore ?? null,
        },
      })
    }
  }

  // ── Certificaties ────────────────────────────────────────────────────────
  if (Array.isArray(rec.certificeringen) && rec.certificeringen.length > 0) {
    for (const certName of rec.certificeringen) {
      const trimmed = certName?.trim()
      if (!trimmed) continue
      // Naam kan heel lang zijn ("CO-Keur Deelnemer van dienstverlener…");
      // pak eerste 4 woorden voor naam, hele string als description.
      const shortName = trimmed
        .split(/[—:.,(]/)[0]!
        .trim()
        .slice(0, 100)
      const slug = slugify(shortName)
      if (!slug) continue
      const cert = await prisma.certification.upsert({
        where: { slug },
        create: { slug, name: shortName, description: trimmed },
        update: {},
      })
      await prisma.tradespersonCertification.upsert({
        where: {
          tradespersonId_certificationId: {
            tradespersonId: tradesperson.id,
            certificationId: cert.id,
          },
        },
        create: { tradespersonId: tradesperson.id, certificationId: cert.id },
        update: {},
      })
    }
  }

  // ── Brancheverenigingen ──────────────────────────────────────────────────
  const associations =
    rec.brancheverenigingen ?? (rec.branchevereniging ? [rec.branchevereniging] : [])
  for (const assocName of associations) {
    const trimmed = assocName?.trim()
    if (!trimmed) continue
    const slug = slugify(trimmed)
    if (!slug) continue
    const assoc = await prisma.industryAssociation.upsert({
      where: { slug },
      create: { slug, name: trimmed },
      update: {},
    })
    await prisma.tradespersonAssociation.upsert({
      where: {
        tradespersonId_associationId: {
          tradespersonId: tradesperson.id,
          associationId: assoc.id,
        },
      },
      create: {
        tradespersonId: tradesperson.id,
        associationId: assoc.id,
        detectionMethod: 'bron',
      },
      update: {},
    })
  }

  // ── Review-bronnen ───────────────────────────────────────────────────────
  if (Array.isArray(rec.review_bronnen) && rec.review_bronnen.length > 0) {
    await prisma.tradespersonReviewSource.deleteMany({
      where: { tradespersonId: tradesperson.id },
    })
    for (const r of rec.review_bronnen) {
      if (!r.url) continue
      await prisma.tradespersonReviewSource.create({
        data: {
          tradespersonId: tradesperson.id,
          platform: r.bron ?? 'unknown',
          url: r.url,
          rating: r.rating ?? null,
          reviewCount: r.aantal ?? null,
        },
      })
    }
  }
}

main()
  .catch((err) => {
    console.error('\n❌ Import failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
