/**
 * Genereert prisma/seed-data/sample-tradespeople.json — een gecureerde subset
 * van vakbedrijven_merged.json (~2100 records, 3.5 MB) die WEL in de Scalingo
 * deploy meegaat. Bron-JSON (24 MB) staat in .slugignore.
 *
 * Run: npx tsx scripts/prepare-seed-data.ts
 *
 * Strategie:
 *  - Quota per bron zodat alle 12 trades vertegenwoordigd zijn:
 *      technieknl (loodgieter/elektr): 1100
 *      bouwendnederland (klusbedrijven): 300
 *      onderhoudnl: 250
 *      bouwgarant: 180
 *      vlok (loodgieters): 100
 *      nvkl (cv-monteurs): 90
 *      groenkeur (hoveniers): 80
 *  - Per bron: sorteer op quality (kvk + tel + web + email + cert + branchev. + reviews)
 *  - Velden trimmen: lange beschrijvingen capped op 500 chars
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const SOURCE_PATH = resolve(process.cwd(), 'vakbedrijven_merged.json')
const OUTPUT_PATH = resolve(process.cwd(), 'prisma/seed-data/sample-tradespeople.json')

const QUOTAS: Record<string, number> = {
  technieknl: 1100,
  bouwendnederland: 300,
  onderhoudnl: 250,
  bouwgarant: 180,
  vlok: 100,
  nvkl: 90,
  groenkeur: 80,
}

type Record_ = {
  bedrijfsnaam?: string
  beschrijving?: string
  enrichment?: { kvk_nummer?: string; beschrijving?: string; [k: string]: unknown }
  telefoonnummer?: string
  website?: string
  email?: string
  certificeringen?: string[]
  brancheverenigingen?: string[]
  google_reviews_count?: number
  _source?: string
  _source_id?: string
  [k: string]: unknown
}

const KEEP_FIELDS = new Set([
  'bedrijfsnaam',
  'plaats',
  'straat',
  'adres',
  'postcode',
  'email',
  'telefoonnummer',
  'website',
  'marktfocus',
  'certificeringen',
  'brancheverenigingen',
  'branchevereniging',
  'specialisaties',
  'social_media',
  'google_reviews_count',
  'google_reviews_score',
  'review_url',
  'zoekterm',
  'sbi_codes',
  'enrichment',
  'relevantie',
  '_source',
  '_source_id',
  '_sources',
  '_source_ids',
  '_fetched_at',
])

function trim(rec: Record_): Record_ {
  const out: Record_ = {}
  for (const k of Object.keys(rec)) {
    if (KEEP_FIELDS.has(k)) out[k] = rec[k] as never
  }
  if (rec.beschrijving) out.beschrijving = rec.beschrijving.slice(0, 500)
  if (out.enrichment && typeof out.enrichment === 'object' && out.enrichment.beschrijving) {
    out.enrichment = {
      ...out.enrichment,
      beschrijving: out.enrichment.beschrijving.slice(0, 500),
    }
  }
  return out
}

function qualityScore(r: Record_): number {
  let s = 0
  if (r.enrichment?.kvk_nummer) s += 20
  if (r.telefoonnummer) s += 5
  if (r.website) s += 5
  if (r.email) s += 5
  if (r.certificeringen?.length) s += 10
  if (r.brancheverenigingen?.length) s += 5
  if ((r.google_reviews_count ?? 0) > 5) s += 10
  return s
}

console.log(`📂 Reading ${SOURCE_PATH}…`)
const raw = readFileSync(SOURCE_PATH, 'utf8')
const data: Record_[] = JSON.parse(raw)
console.log(`📊 ${data.length} records loaded`)

// Bucket per source, sort desc by quality
const bySource = new Map<string, Record_[]>()
for (const r of data) {
  const src = r._source ?? '?'
  if (!bySource.has(src)) bySource.set(src, [])
  bySource.get(src)!.push(r)
}
for (const [, list] of bySource) {
  list.sort((a, b) => qualityScore(b) - qualityScore(a))
}

// Apply quotas
const selected: Record_[] = []
for (const [src, n] of Object.entries(QUOTAS)) {
  const list = bySource.get(src) ?? []
  const take = list.slice(0, n)
  selected.push(...take)
  console.log(`  ${src.padEnd(25)} ${take.length.toString().padStart(4)} / ${n}`)
}

// Deterministic order (by source_id) zodat re-runs hetzelfde bestand geven
selected.sort((a, b) => (a._source_id ?? '').localeCompare(b._source_id ?? ''))

// Trim + write
const trimmed = selected.map(trim)
const json = JSON.stringify(trimmed)
writeFileSync(OUTPUT_PATH, json, 'utf8')

const size = json.length
console.log(`\n✅ Wrote ${OUTPUT_PATH}`)
console.log(`   Records: ${trimmed.length}`)
console.log(`   Size:    ${(size / 1024 / 1024).toFixed(2)} MB`)
