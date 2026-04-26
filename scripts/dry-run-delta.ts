/**
 * Dry-run analyse van de delta-file (nieuwe records om te INSERTEN).
 * Past dezelfde mapping/filter regels toe als scripts/prepare-seed-data.ts:
 *  - Skip relevantie='niet_relevant', bruikbaar=false, fuzzy_duplicate_of
 *  - Map LLM-categorie / categorie_uit_bron → 12 vakgebieden
 *
 * EXTRA: checkt tegen lokale DB of sourceId al bestaat (= zou skip-INSERT zijn).
 * GEEN database writes.
 *
 * Run: npx dotenv -e .env.local -- tsx scripts/dry-run-delta.ts [--file=path]
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['error', 'warn'] })

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
  Leverancier: null,
  Onderwijsinstituut: null,
  Onbekend: null,
  Witgoed: null,
  Witgoedservice: null,
  Witgoedbedrijf: null,
  Schoonmaakbedrijf: null,
  Keuringsbedrijf: null,
}

type Rec = Record<string, unknown> & {
  bedrijfsnaam?: string
  categorie?: string
  categorie_uit_bron?: string
  relevantie?: string
  bruikbaar?: boolean
  fuzzy_duplicate_of?: string
  _import_reason?: string
  _meta?: { _source?: string; _source_id?: string; [k: string]: unknown }
}

function splitCompound(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean)
}

function mapToVakgebied(rec: Rec): { slug: string | null; reason: string } {
  if (rec.relevantie === 'niet_relevant') return { slug: null, reason: 'niet_relevant' }
  if (rec.bruikbaar === false) return { slug: null, reason: 'bruikbaar_false' }
  if (rec.fuzzy_duplicate_of) return { slug: null, reason: 'fuzzy_duplicate' }
  if (!rec.bedrijfsnaam) return { slug: null, reason: 'no_company_name' }

  const candidates = [...splitCompound(rec.categorie), ...splitCompound(rec.categorie_uit_bron)]
  if (candidates.length === 0) return { slug: null, reason: 'no_categorie' }

  for (const cat of candidates) {
    if (cat in CATEGORIE_MAP) {
      const mapped = CATEGORIE_MAP[cat]
      if (mapped == null) return { slug: null, reason: `cat_blacklist:${cat}` }
      return { slug: mapped, reason: `mapped:${cat}` }
    }
  }
  return { slug: null, reason: `unmapped:${candidates[0] ?? 'unknown'}` }
}

async function main() {
  const args = process.argv.slice(2)
  let file = 'prisma/seed-data/delta-2026-04-26-raw.json'
  for (const a of args) {
    if (a.startsWith('--file=')) file = a.slice('--file='.length)
  }
  const filePath = resolve(process.cwd(), file)
  console.log(`📂 Reading ${filePath}…\n`)
  const data: Rec[] = JSON.parse(readFileSync(filePath, 'utf8'))
  console.log(`📊 ${data.length} records loaded\n`)

  // Pre-fetch alle bestaande sourceId's uit DB voor dedup-check
  const existing = await prisma.tradesperson.findMany({
    select: { sourceId: true },
    where: { sourceId: { not: null } },
  })
  const existingSourceIds = new Set(existing.map((r) => r.sourceId).filter(Boolean) as string[])
  console.log(`🗄️  ${existingSourceIds.size} bestaande sourceId's in DB\n`)

  const perVakgebied = new Map<string, number>()
  const perReason = new Map<string, number>()
  const perImportReason = new Map<string, Map<string, number>>() // _import_reason → {vakgebied → count}
  let wouldDuplicate = 0
  let wouldInsert = 0

  for (const rec of data) {
    const { slug, reason } = mapToVakgebied(rec)
    perReason.set(reason, (perReason.get(reason) ?? 0) + 1)

    if (slug) {
      const sid = rec._meta?._source_id
      if (sid && existingSourceIds.has(sid)) {
        wouldDuplicate++
        perReason.set('duplicate_in_db', (perReason.get('duplicate_in_db') ?? 0) + 1)
        continue
      }
      wouldInsert++
      perVakgebied.set(slug, (perVakgebied.get(slug) ?? 0) + 1)

      const importReason = rec._import_reason ?? 'unknown'
      if (!perImportReason.has(importReason)) perImportReason.set(importReason, new Map())
      const sub = perImportReason.get(importReason)!
      sub.set(slug, (sub.get(slug) ?? 0) + 1)
    }
  }

  console.log('='.repeat(60))
  console.log('VAKGEBIED VERDELING (records die ge-INSERT worden)')
  console.log('='.repeat(60))
  for (const slug of [...perVakgebied.keys()].sort()) {
    const n = perVakgebied.get(slug)!
    const pct = (100 * n) / wouldInsert
    const bar = '█'.repeat(Math.floor(pct / 2))
    console.log(
      `  ${slug.padEnd(18)} ${n.toString().padStart(5)}  ${pct.toFixed(1).padStart(5)}%  ${bar}`,
    )
  }
  console.log(`  ${'TOTAAL'.padEnd(18)} ${wouldInsert.toString().padStart(5)}  100.0%`)

  console.log()
  console.log('='.repeat(60))
  console.log('VERDELING PER _import_reason')
  console.log('='.repeat(60))
  for (const [importReason, subMap] of [...perImportReason.entries()].sort()) {
    const total = [...subMap.values()].reduce((a, b) => a + b, 0)
    console.log(`  ${importReason}: ${total} records`)
    for (const slug of [...subMap.keys()].sort()) {
      console.log(`    ${slug.padEnd(18)} ${subMap.get(slug)}`)
    }
  }

  console.log()
  console.log('='.repeat(60))
  console.log('SKIP REDENEN')
  console.log('='.repeat(60))
  let skipped = 0
  for (const [reason, n] of [...perReason.entries()].sort((a, b) => b[1] - a[1])) {
    if (
      reason.startsWith('skip:') ||
      reason.startsWith('unmapped:') ||
      reason.startsWith('cat_blacklist:') ||
      [
        'niet_relevant',
        'bruikbaar_false',
        'fuzzy_duplicate',
        'no_company_name',
        'no_categorie',
        'duplicate_in_db',
      ].includes(reason)
    ) {
      console.log(`  ${reason.padEnd(40)} ${n.toString().padStart(5)}`)
      skipped += n
    }
  }
  console.log(`  ${'TOTAAL geskipt'.padEnd(40)} ${skipped.toString().padStart(5)}`)

  console.log()
  console.log('='.repeat(60))
  console.log('SAMENVATTING')
  console.log('='.repeat(60))
  console.log(`  Bron records:                ${data.length}`)
  console.log(`  Wordt ge-INSERT:             ${wouldInsert}`)
  console.log(`  Skip (categorie/regels):     ${skipped - wouldDuplicate}`)
  console.log(`  Skip (al in DB op sourceId): ${wouldDuplicate}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    void prisma.$disconnect()
  })
