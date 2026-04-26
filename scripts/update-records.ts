/**
 * UPDATE bestaande Tradesperson records op basis van een delta-file.
 *
 * Bron-default: prisma/seed-data/updates-*.json (latest match).
 * Override met --file=<pad>.
 *
 * Per record verwacht:
 *   _source_id        — match key tegen Tradesperson.sourceId
 *   _changed_fields   — string[] met velden die zijn gewijzigd
 *   <field>           — top-level: nieuwe waarde per gewijzigd veld
 *
 * Strategie:
 *   - Alleen UPDATE — geen INSERT. Records zonder match in DB worden
 *     overgeslagen (gerapporteerd, niet ingevoegd).
 *   - Per `_changed_fields` veld: map Nederlands → Prisma kolom + apply.
 *   - Speciaal `categorie`: update vakgebied-pivot (delete oude
 *     TradespersonTrade rows, insert nieuwe).
 *   - Speciaal `email`: re-encrypt + nieuwe emailHash.
 *
 * Run:
 *   npx tsx scripts/update-records.ts                                # default = latest updates-*.json
 *   npx tsx scripts/update-records.ts --file=path/to/updates.json
 *   npx tsx scripts/update-records.ts --dry-run                      # geen DB-writes
 *   npx tsx scripts/update-records.ts --limit=100                    # eerste N records
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import { Prisma, PrismaClient } from '@prisma/client'

import { encrypt, hashEmail } from '../lib/encryption'

const prisma = new PrismaClient({ log: ['error', 'warn'] })

// ============================================================================
// Categorie → vakgebied mapping (zelfde als prepare-seed-data.ts)
// ============================================================================

const CATEGORIE_MAP: Record<string, string | null> = {
  'CV-installateur': 'cv-monteurs',
  'Warmtepomp-installateur': 'cv-monteurs',
  Klimaattechniek: 'cv-monteurs',
  'Airco-installateur': 'cv-monteurs',
  Koeltechniek: 'cv-monteurs',
  Koudetechniek: 'cv-monteurs',
  Ventilatiespecialist: 'cv-monteurs',
  Luchttechniek: 'cv-monteurs',
  Installatietechniek: 'cv-monteurs',
  Dakdekker: 'dakdekkers',
  Elektricien: 'elektriciens',
  Beveiligingsinstallateur: 'elektriciens',
  Domotica: 'elektriciens',
  'Domotica-installateur': 'elektriciens',
  Brandbeveiliging: 'elektriciens',
  Glaszetter: 'glaszetters',
  Hovenier: 'hoveniers',
  Boomverzorger: 'hoveniers',
  Klusbedrijf: 'klusbedrijven',
  Verbouwbedrijf: 'klusbedrijven',
  Renovatiebedrijf: 'klusbedrijven',
  'Onderhoudsbedrijf vastgoed': 'klusbedrijven',
  Onderhoudsbedrijf: 'klusbedrijven',
  Bouwbedrijf: 'klusbedrijven',
  Aannemer: 'klusbedrijven',
  'Zonnepanelen-installateur': 'klusbedrijven',
  Isolatiebedrijf: 'klusbedrijven',
  Badkamerspecialist: 'klusbedrijven',
  Keukenmonteur: 'klusbedrijven',
  Restauratiebedrijf: 'klusbedrijven',
  Afbouwbedrijf: 'klusbedrijven',
  Montagebedrijf: 'klusbedrijven',
  Interieurbouw: 'klusbedrijven',
  Metselaar: 'klusbedrijven',
  Gevelrenovatie: 'klusbedrijven',
  Loodgieter: 'loodgieters',
  'Sanitair-installateur': 'loodgieters',
  Riolering: 'loodgieters',
  Riooltechniek: 'loodgieters',
  Rioolservice: 'loodgieters',
  Rioleringsbedrijf: 'loodgieters',
  Rioolontstopper: 'loodgieters',
  Riool: 'loodgieters',
  Rioolmonteur: 'loodgieters',
  Rioolbeheer: 'loodgieters',
  Schilder: 'schilders',
  Behanger: 'schilders',
  Stukadoor: 'stukadoors',
  Plafondspecialist: 'stukadoors',
  Gipsstelbedrijf: 'stukadoors',
  'Plafond- en wandmonteur': 'stukadoors',
  Plafondmontagebedrijf: 'stukadoors',
  Tegelzetter: 'tegelzetters',
  'Natuursteen-specialist': 'tegelzetters',
  Timmerman: 'timmerlieden',
  Vloerenlegger: 'vloerenleggers',
  Gietvloeren: 'vloerenleggers',
  Gietvloerenbedrijf: 'vloerenleggers',
}

// ============================================================================
// CLI args
// ============================================================================

function findLatestUpdatesFile(): string | null {
  const dir = resolve(process.cwd(), 'prisma/seed-data')
  if (!existsSync(dir)) return null
  const files = readdirSync(dir)
    .filter((f) => f.startsWith('updates-') && f.endsWith('.json'))
    .sort()
  return files.length > 0 ? resolve(dir, files[files.length - 1]!) : null
}

function parseArgs() {
  const args = process.argv.slice(2)
  let file: string | null = null
  let limit: number | null = null
  let dryRun = false
  for (const a of args) {
    if (a.startsWith('--file=')) file = a.slice('--file='.length)
    else if (a.startsWith('--limit=')) limit = Number.parseInt(a.slice('--limit='.length), 10)
    else if (a === '--dry-run') dryRun = true
  }
  if (!file) {
    file = findLatestUpdatesFile()
    if (!file) {
      console.error('❌ Geen updates-*.json gevonden in prisma/seed-data/')
      console.error('   Geef --file=<pad> of zorg dat het bestand bestaat.')
      process.exit(1)
    }
  }
  return { file, limit, dryRun }
}

// ============================================================================
// Helpers
// ============================================================================

function toFloat(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value))
  return Number.isFinite(n) ? n : null
}

function emptyToNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const t = value.trim()
  return t.length === 0 ? null : value
}

// ============================================================================
// Update record
// ============================================================================

type UpdateRecord = {
  _source_id: string
  _bedrijfsnaam_ref?: string
  _changed_fields: string[]
  [key: string]: unknown
}

const stats = {
  total: 0,
  updated: 0,
  skipped_no_match: 0,
  skipped_no_fields: 0,
  errors: 0,
  categorie_changed: 0,
  reasons: new Map<string, number>(),
}

function noteReason(reason: string) {
  stats.reasons.set(reason, (stats.reasons.get(reason) ?? 0) + 1)
}

async function updateOne(rec: UpdateRecord, dryRun: boolean): Promise<void> {
  const sourceId = rec._source_id
  if (!sourceId) {
    stats.skipped_no_match++
    noteReason('no_source_id')
    return
  }

  // Lookup het bestaande Tradesperson record
  const existing = await prisma.tradesperson.findFirst({
    where: { sourceId },
    select: { id: true, slug: true, sourceName: true },
  })
  if (!existing) {
    stats.skipped_no_match++
    return
  }

  const changedFields = new Set(rec._changed_fields ?? [])
  if (changedFields.size === 0) {
    stats.skipped_no_fields++
    return
  }

  // Bouw update payload
  const data: Prisma.TradespersonUpdateInput = {}
  let categorieChange: { newSlug: string | null } | null = null

  for (const field of changedFields) {
    switch (field) {
      case 'beschrijving': {
        data.description = emptyToNull(rec.beschrijving)
        break
      }
      case 'specialisaties': {
        const v = rec.specialisaties
        data.specialties = Array.isArray(v) ? (v as string[]) : []
        break
      }
      case 'categorie': {
        const cat = typeof rec.categorie === 'string' ? rec.categorie : ''
        // Compound categorieën splitten: "Stukadoor + Vloerenlegger" → eerste mapped
        const candidates = cat
          .split('+')
          .map((p) => p.trim())
          .filter(Boolean)
        let mapped: string | null = null
        for (const c of candidates) {
          if (c in CATEGORIE_MAP) {
            mapped = CATEGORIE_MAP[c] ?? null
            break
          }
        }
        categorieChange = { newSlug: mapped }
        if (mapped == null) noteReason(`categorie_unmappable:${cat}`)
        break
      }
      case 'postcode': {
        data.postalCode = emptyToNull(rec.postcode)
        break
      }
      case 'latitude': {
        data.latitude = toFloat(rec.latitude)
        break
      }
      case 'longitude': {
        data.longitude = toFloat(rec.longitude)
        break
      }
      case 'telefoonnummer': {
        data.phone = emptyToNull(rec.telefoonnummer)
        break
      }
      case 'email': {
        const e = typeof rec.email === 'string' ? rec.email.trim().toLowerCase() : ''
        if (e && e.includes('@')) {
          data.email = encrypt(e)
          data.emailHash = hashEmail(e)
        } else {
          data.email = null
          data.emailHash = null
        }
        break
      }
      case 'tel_invalide': {
        data.phoneInvalid = rec.tel_invalide === true
        break
      }
      case 'email_dns_invalide': {
        data.emailDnsInvalid = rec.email_dns_invalide === true
        break
      }
      case 'email_website_mismatch': {
        data.emailWebsiteMismatch = rec.email_website_mismatch === true
        break
      }
      case 'website_status': {
        data.websiteStatus = emptyToNull(rec.website_status)
        break
      }
      case 'website': {
        data.websiteUrl = emptyToNull(rec.website)
        break
      }
      case 'review_nodig': {
        data.reviewNeeded = rec.review_nodig === true
        break
      }
      case 'vertrouwensscore': {
        const v = rec.vertrouwensscore
        data.trustScore = typeof v === 'number' ? v : null
        break
      }
      case 'relevantie': {
        // 'niet_relevant' → markeer privacySensitive (we importeerden 'm tóch)
        const v = rec.relevantie
        data.privacySensitive = v === 'niet_relevant'
        break
      }
      case 'gemeente':
      case 'provincie':
      case 'team_omvang':
      case 'doelgroep':
      case 'werkgebied':
      case 'diensten_lijst':
      case 'unique_selling_points':
      case 'talen':
      case 'logo_url':
      case 'google_place_id':
      case 'offerte_gratis':
      case 'spoeddienst': {
        // Deze velden gaan in de enrichmentMeta JSON-kolom. We doen merge
        // (read existing → overwrite key → write back) hieronder na de
        // update — niet via Prisma update direct.
        break
      }
      default: {
        noteReason(`unhandled_field:${field}`)
      }
    }
  }

  // Detect of er metadata-velden zijn (require JSON merge)
  const metaFields = [
    'gemeente',
    'provincie',
    'team_omvang',
    'doelgroep',
    'werkgebied',
    'diensten_lijst',
    'unique_selling_points',
    'talen',
    'logo_url',
    'google_place_id',
    'offerte_gratis',
    'spoeddienst',
  ] as const
  const hasMetaChanges = metaFields.some((f) => changedFields.has(f))

  if (Object.keys(data).length === 0 && !categorieChange && !hasMetaChanges) {
    stats.skipped_no_fields++
    return
  }

  if (dryRun) {
    stats.updated++
    if (categorieChange) stats.categorie_changed++
    return
  }

  // Apply update
  await prisma.tradesperson.update({
    where: { id: existing.id },
    data,
  })

  // Categorie pivot updaten
  if (categorieChange) {
    await prisma.tradespersonTrade.deleteMany({
      where: { tradespersonId: existing.id },
    })
    if (categorieChange.newSlug) {
      const newTrade = await prisma.trade.findUnique({
        where: { slug: categorieChange.newSlug },
        select: { id: true },
      })
      if (newTrade) {
        await prisma.tradespersonTrade.create({
          data: {
            tradespersonId: existing.id,
            tradeId: newTrade.id,
            isPrimary: true,
          },
        })
      }
    }
    stats.categorie_changed++
  }

  // Enrichment-metadata JSON merge (read-modify-write)
  if (hasMetaChanges) {
    const current = await prisma.tradesperson.findUnique({
      where: { id: existing.id },
      select: { enrichmentMeta: true },
    })
    const merged: Record<string, unknown> =
      current?.enrichmentMeta && typeof current.enrichmentMeta === 'object'
        ? { ...(current.enrichmentMeta as Record<string, unknown>) }
        : {}

    if (changedFields.has('gemeente')) merged.gemeente = rec.gemeente ?? null
    if (changedFields.has('provincie')) merged.provincie = rec.provincie ?? null
    if (changedFields.has('team_omvang')) merged.teamOmvang = rec.team_omvang ?? null
    if (changedFields.has('doelgroep')) merged.doelgroep = rec.doelgroep ?? null
    if (changedFields.has('werkgebied')) merged.werkgebied = rec.werkgebied ?? null
    if (changedFields.has('diensten_lijst')) merged.diensten = rec.diensten_lijst ?? null
    if (changedFields.has('unique_selling_points'))
      merged.uniqueSellingPoints = rec.unique_selling_points ?? null
    if (changedFields.has('talen')) merged.talen = rec.talen ?? null
    if (changedFields.has('logo_url')) merged.logoUrl = rec.logo_url ?? null
    if (changedFields.has('google_place_id')) merged.googlePlaceId = rec.google_place_id ?? null
    if (changedFields.has('offerte_gratis')) merged.offerteGratis = rec.offerte_gratis ?? null
    // spoeddienst gaat ook naar de DB-kolom emergencyService bovenop meta
    if (changedFields.has('spoeddienst')) {
      await prisma.tradesperson.update({
        where: { id: existing.id },
        data: { emergencyService: rec.spoeddienst === true },
      })
    }

    // Strip null entries voor compactheid
    for (const k of Object.keys(merged)) {
      if (merged[k] == null) delete merged[k]
    }

    await prisma.tradesperson.update({
      where: { id: existing.id },
      data: {
        enrichmentMeta:
          Object.keys(merged).length > 0 ? (merged as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    })
  }

  stats.updated++
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const { file, limit, dryRun } = parseArgs()
  const filePath = resolve(process.cwd(), file)
  console.log(`📂 Reading ${filePath}…`)
  const raw = readFileSync(filePath, 'utf8')
  const data: UpdateRecord[] = JSON.parse(raw)
  console.log(`📊 ${data.length} update records loaded`)
  if (limit) console.log(`   Limit: ${limit}`)
  if (dryRun) console.log(`   ⚠ DRY RUN — geen DB-writes`)

  const toProcess = limit ? data.slice(0, limit) : data
  stats.total = toProcess.length

  const startTime = Date.now()

  for (let i = 0; i < toProcess.length; i++) {
    const rec = toProcess[i]!
    try {
      await updateOne(rec, dryRun)
    } catch (err) {
      stats.errors++
      const msg = err instanceof Error ? err.message : String(err)
      noteReason(`error:${msg.slice(0, 80)}`)
      if (stats.errors < 5) {
        console.error(`  ❌ Record ${i} (${rec._bedrijfsnaam_ref ?? rec._source_id}): ${msg}`)
      }
    }

    if ((i + 1) % 250 === 0 || i === toProcess.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const rate = ((i + 1) / Number(elapsed)).toFixed(0)
      console.log(
        `  ${i + 1}/${toProcess.length}  upd=${stats.updated}  skip(no_match)=${stats.skipped_no_match}  err=${stats.errors}  (${elapsed}s, ${rate}/s)`,
      )
    }
  }

  console.log('\n────────────────────────────────────────')
  console.log(`✅ Total processed:        ${stats.total}`)
  console.log(`   Updated:                ${stats.updated}`)
  console.log(`   Skipped (no DB match):  ${stats.skipped_no_match}`)
  console.log(`   Skipped (no fields):    ${stats.skipped_no_fields}`)
  console.log(`   Errors:                 ${stats.errors}`)
  console.log(`   Categorie changes:      ${stats.categorie_changed}`)

  if (stats.reasons.size > 0) {
    console.log('\n   Skip/error redenen:')
    const sorted = [...stats.reasons.entries()].sort((a, b) => b[1] - a[1])
    for (const [reason, count] of sorted.slice(0, 15)) {
      console.log(`     ${count.toString().padStart(5)}  ${reason}`)
    }
  }

  console.log('────────────────────────────────────────\n')
}

main()
  .catch((err) => {
    console.error('\n❌ Update failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    void prisma.$disconnect()
  })
