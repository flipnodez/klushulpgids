/**
 * Import-script voor gecureerde vakmensen-dataset.
 *
 * Bron-default: `prisma/seed-data/sample-tradespeople.json` — gegenereerd
 * door `scripts/prepare-seed-data.ts` uit de enrichment-pipeline output.
 * Records hebben al een `_vakgebied` veld (één van de 12 slugs) en quality-
 * flags zoals `review_nodig`, `tel_invalide`, `email_dns_invalide`,
 * `email_website_mismatch`, `website_status`, `vertrouwensscore`.
 *
 * Strategie:
 *  - --replace: TRUNCATE Tradesperson + relaties vóór import (DEFAULT bij
 *    nieuwe seed-data om stale records weg te halen). Trade/City zaden
 *    blijven bestaan.
 *  - --append: alleen upsert (idempotent), geen truncate.
 *  - Email AES-encrypted via lib/encryption.ts; emailHash voor dedup.
 *  - Quality-flags worden Tradesperson kolommen.
 *  - Brancheverenigingen + certificeringen blijven upsert + pivot link.
 *
 * Run:
 *   npx tsx scripts/import-sample-data.ts                       # default = curated subset, --replace
 *   npx tsx scripts/import-sample-data.ts --append               # alleen toevoegen, geen truncate
 *   npx tsx scripts/import-sample-data.ts --limit=200            # eerste N records
 *   npx tsx scripts/import-sample-data.ts --file=foo.json        # ander bestand
 *   npx tsx scripts/import-sample-data.ts --dry-run              # geen DB-writes
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import {
  Prisma,
  PrismaClient,
  type AvailabilityStatus,
  type MarketFocus,
  type TeamSize,
} from '@prisma/client'

import { encrypt, hashEmail } from '../lib/encryption'

const prisma = new PrismaClient({ log: ['error', 'warn'] })

// ============================================================================
// Type van één gecureerd record (output van prepare-seed-data.ts)
// ============================================================================

type CuratedRecord = {
  bedrijfsnaam: string
  plaats?: string
  gemeente?: string
  provincie?: string
  straat?: string
  postcode?: string
  latitude?: number
  longitude?: number
  email?: string
  telefoonnummer?: string
  website?: string
  beschrijving?: string | null
  marktfocus?: string
  certificeringen?: string[]
  brancheverenigingen?: string[]
  specialisaties?: string[]
  diensten_lijst?: string[]
  unique_selling_points?: string[]
  talen?: string[]
  werkgebied?: string[]
  doelgroep?: string
  team_omvang?: string | number
  spoeddienst?: boolean
  offerte_gratis?: boolean
  social_media?: Record<string, unknown>
  google_reviews_count?: number
  google_reviews_score?: number
  google_place_id?: string
  review_url?: string
  review_bronnen?: Array<{ url?: string; bron?: string; rating?: number; aantal?: number }>
  logo_url?: string
  sbi_codes?: Array<{ sbi_code?: string; sbi_naam?: string; score?: number; keywords?: string[] }>
  relevantie?: string
  review_nodig?: boolean
  tel_invalide?: boolean
  email_dns_invalide?: boolean
  email_website_mismatch?: boolean
  website_status?: string
  vertrouwensscore?: number
  bruikbaar?: boolean | null
  _meta?: {
    _source?: string
    _source_id?: string
    _sources?: string[]
    _source_ids?: string[]
    _fetched_at?: string
    kvk_nummer?: string
    btw_nummer?: string
    [k: string]: unknown
  }
  _vakgebied: string // Komt uit prepare-seed-data, vereist
}

// ============================================================================
// CLI flags
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2)
  const curated = 'prisma/seed-data/sample-tradespeople.json'
  let file = existsSync(curated) ? curated : 'vakbedrijven_merged.json'
  let limit: number | null = null
  let dryRun = false
  let append = false
  for (const a of args) {
    if (a.startsWith('--file=')) file = a.slice('--file='.length)
    else if (a.startsWith('--limit=')) limit = Number.parseInt(a.slice('--limit='.length), 10)
    else if (a === '--dry-run') dryRun = true
    else if (a === '--append') append = true
  }
  return { file, limit, dryRun, append }
}

// ============================================================================
// Helpers
// ============================================================================

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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

function mapTeamSize(input: string | number | undefined): TeamSize | null {
  if (input == null) return null
  const s = String(input).toLowerCase()
  // Numeric: parse direct
  const n = Number.parseInt(s, 10)
  if (!Number.isNaN(n)) {
    if (n <= 1) return 'SOLO'
    if (n <= 4) return 'SMALL'
    if (n <= 10) return 'MEDIUM'
    return 'LARGE'
  }
  // Tekst-hints
  if (s.includes('zzp') || s.includes('eenmans') || s === 'solo') return 'SOLO'
  if (/2-4|2 tot 4|klein/i.test(s)) return 'SMALL'
  if (/5-10|middelgroot|medium/i.test(s)) return 'MEDIUM'
  if (/groot|10\+|large/i.test(s)) return 'LARGE'
  return null
}

function inferAvailability(_rec: CuratedRecord): AvailabilityStatus {
  // Geen explicit availability in scrape data — alle import krijgt UNKNOWN.
  // Vakman update dit zelf in fase 6 dashboard.
  return 'UNKNOWN'
}

function calcQualityScore(rec: CuratedRecord): number {
  let score = 0
  if (rec._meta?.kvk_nummer) score += 20
  const desc = rec.beschrijving ?? ''
  if (desc.length > 100) score += 10
  if (rec.telefoonnummer) score += 10
  if (rec.website) score += 10
  if (rec.email) score += 10
  if ((rec.certificeringen ?? []).length > 0) score += 15
  if ((rec.brancheverenigingen ?? []).length > 0) score += 10
  if ((rec.google_reviews_count ?? 0) > 5) score += 10
  if ((rec.specialisaties ?? []).length > 0) score += 5
  // Aftrek voor data-issues
  if (rec.tel_invalide) score -= 5
  if (rec.email_dns_invalide) score -= 5
  if (rec.website_status && rec.website_status !== 'ok') score -= 5
  return Math.max(0, Math.min(score, 100))
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

function toFloat(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value))
  return Number.isFinite(n) ? n : null
}

function parseAddress(rec: CuratedRecord): { street?: string; houseNumber?: string } {
  const src = rec.straat?.trim()
  if (!src) return {}
  const m = src.match(/^(.*?)\s+(\d+\s*[a-zA-Z-]?\s*\d*)\s*$/)
  if (m) return { street: m[1]?.trim(), houseNumber: m[2]?.replace(/\s/g, '') }
  return { street: src }
}

function buildEnrichmentMeta(rec: CuratedRecord): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  const meta: Record<string, unknown> = {}
  if (rec.diensten_lijst?.length) meta.diensten = rec.diensten_lijst
  if (rec.unique_selling_points?.length) meta.uniqueSellingPoints = rec.unique_selling_points
  if (rec.talen?.length) meta.talen = rec.talen
  if (rec.werkgebied?.length) meta.werkgebied = rec.werkgebied
  if (rec.doelgroep) meta.doelgroep = rec.doelgroep
  if (rec.team_omvang != null) meta.teamOmvang = rec.team_omvang
  if (rec.offerte_gratis != null) meta.offerteGratis = rec.offerte_gratis
  if (rec.gemeente) meta.gemeente = rec.gemeente
  if (rec.provincie) meta.provincie = rec.provincie
  if (rec.logo_url) meta.logoUrl = rec.logo_url
  if (rec.google_place_id) meta.googlePlaceId = rec.google_place_id
  if (rec._meta?.btw_nummer) meta.btw = rec._meta.btw_nummer
  return Object.keys(meta).length === 0 ? Prisma.JsonNull : (meta as Prisma.InputJsonValue)
}

// ============================================================================
// Stats
// ============================================================================

const stats = {
  total: 0,
  imported: 0,
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
  const { file, limit, dryRun, append } = parseArgs()
  const filePath = resolve(process.cwd(), file)
  console.log(`📂 Reading ${filePath}…`)
  const raw = readFileSync(filePath, 'utf8')
  const records: CuratedRecord[] = JSON.parse(raw)
  console.log(`📊 ${records.length} records loaded`)
  if (limit) console.log(`   Limit: ${limit}`)
  if (dryRun) console.log(`   ⚠ DRY RUN — geen DB-writes`)
  if (append) console.log(`   Mode: APPEND (geen truncate)`)
  else console.log(`   Mode: REPLACE (truncate Tradesperson eerst)`)

  // Pre-load lookup maps
  const trades = await prisma.trade.findMany({ select: { id: true, slug: true } })
  const tradeIdBySlug = new Map(trades.map((t) => [t.slug, t.id]))
  console.log(`🛠️  ${trades.length} trades cached`)

  const cities = await prisma.city.findMany({ select: { id: true, slug: true } })
  const cityIdBySlug = new Map(cities.map((c) => [c.slug, c.id]))
  console.log(`🏙️  ${cities.length} cities cached`)

  // TRUNCATE tabellen die per import vervangen mogen worden
  if (!append && !dryRun) {
    console.log(`\n🧹 Truncating Tradesperson + relaties…`)
    await prisma.$executeRaw`
      TRUNCATE TABLE
        "Tradesperson",
        "TradespersonTrade",
        "TradespersonServiceArea",
        "TradespersonCertification",
        "TradespersonAssociation",
        "TradespersonReviewSource",
        "TradespersonPhoto",
        "Review",
        "PageView"
      RESTART IDENTITY CASCADE
    `
    console.log(`   ✓ Tabellen geleegd (Trade/City/Certification/IndustryAssociation blijven)`)
  }

  const existingSlugs = new Set<string>()

  const toProcess = limit ? records.slice(0, limit) : records
  stats.total = toProcess.length

  const startTime = Date.now()

  for (let i = 0; i < toProcess.length; i++) {
    const rec = toProcess[i]!
    try {
      await importOne(rec, { tradeIdBySlug, cityIdBySlug, existingSlugs, dryRun, append })
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
        `  ${i + 1}/${toProcess.length}  imp=${stats.imported}  skip=${stats.skipped}  err=${stats.errors}  (${elapsed}s, ${rate}/s)`,
      )
    }
  }

  // Final report
  console.log('\n────────────────────────────────────────')
  console.log(`✅ Total processed:    ${stats.total}`)
  console.log(`   Imported:           ${stats.imported}`)
  console.log(`   Skipped:            ${stats.skipped}`)
  console.log(`   Errors:             ${stats.errors}`)
  console.log(`   No city match:      ${stats.noCityMatch}  (cityId=NULL)`)
  console.log(`   No trade match:     ${stats.noTradeMatch}`)

  if (stats.reasons.size > 0) {
    console.log('\n   Skip/error redenen:')
    const sorted = [...stats.reasons.entries()].sort((a, b) => b[1] - a[1])
    for (const [reason, count] of sorted.slice(0, 10)) {
      console.log(`     ${count.toString().padStart(5)}  ${reason}`)
    }
  }

  // Counts per vakgebied
  if (!dryRun) {
    const byTrade = await prisma.tradespersonTrade.groupBy({
      by: ['tradeId'],
      _count: true,
    })
    const tradeNames = new Map(trades.map((t) => [t.id, t.slug]))
    console.log(`\n   Per vakgebied:`)
    for (const row of byTrade.sort((a, b) => b._count - a._count)) {
      console.log(`     ${(tradeNames.get(row.tradeId) ?? row.tradeId).padEnd(18)} ${row._count}`)
    }
  }

  console.log('────────────────────────────────────────\n')
}

// ============================================================================
// Eén record importeren
// ============================================================================

async function importOne(
  rec: CuratedRecord,
  ctx: {
    tradeIdBySlug: Map<string, string>
    cityIdBySlug: Map<string, string>
    existingSlugs: Set<string>
    dryRun: boolean
    append: boolean
  },
) {
  const companyName = rec.bedrijfsnaam?.trim()
  if (!companyName) {
    stats.skipped++
    noteReason('no companyName')
    return
  }

  const sourceName = rec._meta?._source ?? rec._meta?._sources?.[0]
  const sourceId = rec._meta?._source_id ?? rec._meta?._source_ids?.[0]

  // Match trade — _vakgebied is gegarandeerd uit prepare-seed-data
  const tradeId = ctx.tradeIdBySlug.get(rec._vakgebied)
  if (!tradeId) {
    stats.noTradeMatch++
    noteReason(`unknown_vakgebied:${rec._vakgebied}`)
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
  const kvk = rec._meta?.kvk_nummer?.replace(/\s/g, '') || null
  const btw = rec._meta?.btw_nummer || null

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

  // Find existing (alleen relevant in --append mode; in --replace is alles leeg)
  const existing =
    ctx.append && (kvk || (sourceName && sourceId))
      ? kvk
        ? await prisma.tradesperson.findUnique({ where: { kvkNumber: kvk } })
        : await prisma.tradesperson.findFirst({ where: { sourceName, sourceId } })
      : null

  const description = rec.beschrijving?.slice(0, 5000) ?? null
  const { street, houseNumber } = parseAddress(rec)

  const data = {
    companyName,
    kvkNumber: kvk,
    btwNumber: btw,
    description,
    email: emailEnc,
    emailHash,
    phone: rec.telefoonnummer || null,
    websiteUrl: rec.website || null,
    socialMedia: rec.social_media ? (rec.social_media as Prisma.InputJsonValue) : Prisma.JsonNull,
    street,
    houseNumber,
    postalCode: rec.postcode || null,
    cityId,
    latitude: toFloat(rec.latitude),
    longitude: toFloat(rec.longitude),
    marketFocus: mapMarketFocus(rec.marktfocus),
    teamSize: mapTeamSize(rec.team_omvang),
    emergencyService: rec.spoeddienst === true,
    availabilityStatus: inferAvailability(rec),
    specialties: rec.specialisaties ?? [],
    googleRating: rec.google_reviews_score ?? null,
    googleReviewsCount: rec.google_reviews_count ?? null,
    qualityScore: calcQualityScore(rec),
    sourcesUsed: rec._meta?._sources ?? (rec._meta?._source ? [rec._meta._source] : []),
    sourceId: sourceId ?? null,
    sourceName: sourceName ?? null,
    privacySensitive: rec.relevantie === 'niet_relevant',
    scrapedAt: rec._meta?._fetched_at ? new Date(rec._meta._fetched_at) : null,
    // Quality flags
    reviewNeeded: rec.review_nodig === true,
    phoneInvalid: rec.tel_invalide === true,
    emailDnsInvalid: rec.email_dns_invalide === true,
    emailWebsiteMismatch: rec.email_website_mismatch === true,
    websiteStatus: rec.website_status ?? null,
    trustScore: rec.vertrouwensscore ?? null,
    enrichmentMeta: buildEnrichmentMeta(rec),
  }

  if (ctx.dryRun) {
    stats.imported++
    return
  }

  let tradesperson
  if (existing) {
    tradesperson = await prisma.tradesperson.update({
      where: { id: existing.id },
      data,
    })
  } else {
    const baseSlug = slugify(companyName)
    const slug = uniqueSlug(ctx.existingSlugs, baseSlug || `bedrijf-${sourceId ?? Date.now()}`)
    try {
      tradesperson = await prisma.tradesperson.create({
        data: { ...data, slug },
      })
    } catch (err) {
      // Duplicaat emailHash → retry zonder email
      if (err instanceof Error && err.message.includes('emailHash')) {
        noteReason('emailHash collision — saved without email')
        tradesperson = await prisma.tradesperson.create({
          data: { ...data, slug, email: null, emailHash: null },
        })
      } else {
        throw err
      }
    }
  }
  stats.imported++

  // Trade pivot
  if (tradeId) {
    await prisma.tradespersonTrade.upsert({
      where: {
        tradespersonId_tradeId: { tradespersonId: tradesperson.id, tradeId },
      },
      create: {
        tradespersonId: tradesperson.id,
        tradeId,
        isPrimary: true,
      },
      update: { isPrimary: true },
    })
  }

  // Certificaties
  for (const certName of rec.certificeringen ?? []) {
    const trimmed = certName?.trim()
    if (!trimmed) continue
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

  // Brancheverenigingen
  for (const assocName of rec.brancheverenigingen ?? []) {
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
        detectionMethod: 'enrichment',
      },
      update: {},
    })
  }

  // Review-bronnen
  if (Array.isArray(rec.review_bronnen) && rec.review_bronnen.length > 0) {
    for (const r of rec.review_bronnen) {
      if (!r.url) continue
      // create-or-skip (geen unique key voor upsert)
      const exists = await prisma.tradespersonReviewSource.findFirst({
        where: { tradespersonId: tradesperson.id, url: r.url },
      })
      if (!exists) {
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
}

main()
  .catch((err) => {
    console.error('\n❌ Import failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    void prisma.$disconnect()
  })
