/**
 * Genereert prisma/seed-data/sample-tradespeople.json (gecureerd, ~5700 records)
 * vanuit de enrichment-pipeline output.
 *
 * Strategie:
 *  - Skip relevantie='niet_relevant', bruikbaar=false, fuzzy_duplicate_of
 *  - Map LLM-categorie (en categorie_uit_bron als fallback) naar 12 vakgebieden
 *  - Bewaar quality-vlaggen per record (review_nodig, tel_invalide, etc.)
 *  - Records zonder enkele categorie → schreven naar
 *    `data-archive/needs-categorie-classification.json` voor latere curatie
 *
 * Run: npx tsx scripts/prepare-seed-data.ts
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'

// CLI: --in=<path> en --out=<path> overrulen de defaults.
function parseArgs() {
  const args = process.argv.slice(2)
  let inPath = resolve(process.cwd(), 'vakbedrijven_merged_enriched_openai_clean_qc.json')
  let outPath = resolve(process.cwd(), 'prisma/seed-data/sample-tradespeople.json')
  let archivePath = resolve(process.cwd(), 'data-archive/needs-categorie-classification.json')
  for (const a of args) {
    if (a.startsWith('--in=')) inPath = resolve(process.cwd(), a.slice('--in='.length))
    else if (a.startsWith('--out=')) outPath = resolve(process.cwd(), a.slice('--out='.length))
    else if (a.startsWith('--archive='))
      archivePath = resolve(process.cwd(), a.slice('--archive='.length))
  }
  return { inPath, outPath, archivePath }
}

const { inPath: SOURCE_PATH, outPath: OUTPUT_PATH, archivePath: ARCHIVE_PATH } = parseArgs()

// 40+ LLM-categorieën → 12 vakgebieden. None = SKIP.
const CATEGORIE_MAP: Record<string, string | null> = {
  // CV-monteurs
  'CV-installateur': 'cv-monteurs',
  'Warmtepomp-installateur': 'cv-monteurs',
  Klimaattechniek: 'cv-monteurs',
  'Airco-installateur': 'cv-monteurs',
  Koeltechniek: 'cv-monteurs',
  Koudetechniek: 'cv-monteurs',
  Ventilatiespecialist: 'cv-monteurs',
  Luchttechniek: 'cv-monteurs',
  Installatietechniek: 'cv-monteurs',
  // Dakdekkers
  Dakdekker: 'dakdekkers',
  // Elektriciens
  Elektricien: 'elektriciens',
  Beveiligingsinstallateur: 'elektriciens',
  Domotica: 'elektriciens',
  'Domotica-installateur': 'elektriciens',
  Brandbeveiliging: 'elektriciens',
  // Glaszetters
  Glaszetter: 'glaszetters',
  // Hoveniers
  Hovenier: 'hoveniers',
  Boomverzorger: 'hoveniers',
  // Klusbedrijven
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
  // Loodgieters
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
  // Schilders
  Schilder: 'schilders',
  Behanger: 'schilders',
  // Stukadoors
  Stukadoor: 'stukadoors',
  Plafondspecialist: 'stukadoors',
  Gipsstelbedrijf: 'stukadoors',
  'Plafond- en wandmonteur': 'stukadoors',
  Plafondmontagebedrijf: 'stukadoors',
  // Tegelzetters
  Tegelzetter: 'tegelzetters',
  'Natuursteen-specialist': 'tegelzetters',
  // Timmerlieden
  Timmerman: 'timmerlieden',
  // Vloerenleggers
  Vloerenlegger: 'vloerenleggers',
  Gietvloeren: 'vloerenleggers',
  Gietvloerenbedrijf: 'vloerenleggers',
  // SKIP
  Leverancier: null,
  Onderwijsinstituut: null,
  Onbekend: null,
  Witgoed: null,
  Witgoedservice: null,
  Witgoedbedrijf: null,
  Schoonmaakbedrijf: null,
  Keuringsbedrijf: null,
}

type RawRecord = Record<string, unknown> & {
  bedrijfsnaam?: string
  categorie?: string
  categorie_uit_bron?: string
  relevantie?: string
  bruikbaar?: boolean
  fuzzy_duplicate_of?: string
}

function splitCompound(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean)
}

// Delta-only fallback: records zonder LLM-categorie krijgen via _import_reason
// alsnog een vakgebied (alleen waar de bron 100% gespecialiseerd is).
const IMPORT_REASON_FALLBACK: Record<string, string> = {
  recovered_groenkeur: 'hoveniers', // Groenkeur = keurmerk groenvoorziening
}

function mapToVakgebied(rec: RawRecord): { slug: string | null; reason: string } {
  if (rec.relevantie === 'niet_relevant') return { slug: null, reason: 'niet_relevant' }
  if (rec.bruikbaar === false) return { slug: null, reason: 'bruikbaar_false' }
  if (rec.fuzzy_duplicate_of) return { slug: null, reason: 'fuzzy_duplicate' }
  if (!rec.bedrijfsnaam) return { slug: null, reason: 'no_company_name' }

  const candidates = [...splitCompound(rec.categorie), ...splitCompound(rec.categorie_uit_bron)]

  for (const cat of candidates) {
    if (cat in CATEGORIE_MAP) {
      const mapped = CATEGORIE_MAP[cat]
      if (mapped == null) return { slug: null, reason: `cat_blacklist:${cat}` }
      return { slug: mapped, reason: `mapped:${cat}` }
    }
  }

  // Fallback voor delta-records met bekende _import_reason
  const importReason = (rec as Record<string, unknown>)._import_reason
  if (typeof importReason === 'string' && importReason in IMPORT_REASON_FALLBACK) {
    const slug = IMPORT_REASON_FALLBACK[importReason]!
    return { slug, reason: `import_reason_fallback:${importReason}` }
  }

  if (candidates.length === 0) return { slug: null, reason: 'no_categorie' }
  return { slug: null, reason: `unmapped:${candidates[0] ?? 'unknown'}` }
}

// Drop empty fields om JSON klein te houden.
function pruneEmpty<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '' || v === false) continue
    if (Array.isArray(v) && v.length === 0) continue
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue
    out[k] = v
  }
  return out
}

// Trim record voor deploy-bundle. Aggressief trimmen — push naar GitHub faalt
// boven ~10 MB. Behoud alleen wat het import-script daadwerkelijk gebruikt.
function trim(rec: RawRecord, vakgebied: string): Record<string, unknown> {
  // Beschrijving: 400 chars max
  const beschr = typeof rec.beschrijving === 'string' ? rec.beschrijving.slice(0, 400) : null

  // _meta: alleen kvk + btw + source. KvK/BTW kunnen op top-level (delta-bestanden)
  // OF nested onder _meta (eerste enrichment-batch) zitten — pak waar 't ook is.
  const m = (rec._meta ?? {}) as Record<string, unknown>
  const r = rec as Record<string, unknown>
  const meta = pruneEmpty({
    _source: m._source,
    _source_id: m._source_id,
    _fetched_at: m._fetched_at,
    kvk_nummer: r.kvk_nummer ?? m.kvk_nummer,
    btw_nummer: r.btw_nummer ?? m.btw_nummer,
  })

  // Cap arrays op redelijke maxima
  const certs = Array.isArray(rec.certificeringen)
    ? rec.certificeringen.slice(0, 8).map((c) => (typeof c === 'string' ? c.slice(0, 120) : c))
    : []
  const associations = Array.isArray(rec.brancheverenigingen)
    ? rec.brancheverenigingen.slice(0, 5)
    : []
  const specs = Array.isArray(rec.specialisaties) ? rec.specialisaties.slice(0, 8) : []
  const diensten = Array.isArray(rec.diensten_lijst) ? rec.diensten_lijst.slice(0, 6) : []
  const usp = Array.isArray(rec.unique_selling_points) ? rec.unique_selling_points.slice(0, 3) : []

  // Review-bronnen: alleen url + bron. Query-params verwijderd uit URLs om
  // te voorkomen dat scraped Google Maps API keys (uit embed-iframes) in de
  // dataset belanden — GitHub secret scanner detecteert deze terecht.
  const reviewBronnen = Array.isArray(rec.review_bronnen)
    ? rec.review_bronnen.slice(0, 3).map((r) => {
        const item = r as Record<string, unknown>
        let url = typeof item.url === 'string' ? item.url : null
        if (url) {
          try {
            const u = new URL(url)
            u.search = '' // strip alle query-params
            u.hash = ''
            url = u.toString()
          } catch {
            // Niet-parsebare URL → laat staan (komt zelden voor)
          }
        }
        return pruneEmpty({ url, bron: item.bron })
      })
    : []

  return pruneEmpty({
    bedrijfsnaam: rec.bedrijfsnaam,
    plaats: rec.plaats,
    gemeente: rec.gemeente,
    provincie: rec.provincie,
    straat: rec.straat,
    postcode: rec.postcode,
    latitude: rec.latitude,
    longitude: rec.longitude,
    email: rec.email,
    telefoonnummer: rec.telefoonnummer,
    website: rec.website,
    beschrijving: beschr,
    marktfocus: rec.marktfocus,
    certificeringen: certs,
    brancheverenigingen: associations,
    specialisaties: specs,
    diensten_lijst: diensten,
    unique_selling_points: usp,
    team_omvang: rec.team_omvang,
    spoeddienst: rec.spoeddienst,
    social_media: rec.social_media,
    google_reviews_count: rec.google_reviews_count,
    google_reviews_score: rec.google_reviews_score,
    review_bronnen: reviewBronnen,
    relevantie: rec.relevantie,
    review_nodig: rec.review_nodig === true,
    tel_invalide: rec.tel_invalide === true,
    email_dns_invalide: rec.email_dns_invalide === true,
    email_website_mismatch: rec.email_website_mismatch === true,
    website_status: rec.website_status,
    vertrouwensscore: rec.vertrouwensscore,
    _meta: meta,
    _vakgebied: vakgebied,
  })
}

console.log(`📂 Reading ${SOURCE_PATH}…`)
const raw = readFileSync(SOURCE_PATH, 'utf8')
const data: RawRecord[] = JSON.parse(raw)
console.log(`📊 ${data.length} records loaded\n`)

const imported: Record<string, unknown>[] = []
const archive: RawRecord[] = []
const skipReasons = new Map<string, number>()
const perVakgebied = new Map<string, number>()

for (const rec of data) {
  const { slug, reason } = mapToVakgebied(rec)
  skipReasons.set(reason, (skipReasons.get(reason) ?? 0) + 1)

  if (slug) {
    perVakgebied.set(slug, (perVakgebied.get(slug) ?? 0) + 1)
    imported.push(trim(rec, slug))
  } else if (reason === 'no_categorie') {
    archive.push(rec)
  }
  // Anders: skip volledig (relevantie/bruikbaar/blacklist/duplicate)
}

// Sorteer deterministisch voor reproduceerbare diffs
imported.sort(
  (a, b) =>
    String(a._vakgebied).localeCompare(String(b._vakgebied)) ||
    String(a.bedrijfsnaam).localeCompare(String(b.bedrijfsnaam)),
)

mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
mkdirSync(dirname(ARCHIVE_PATH), { recursive: true })

writeFileSync(OUTPUT_PATH, JSON.stringify(imported), 'utf8')
writeFileSync(
  ARCHIVE_PATH,
  JSON.stringify(
    {
      _description:
        'Records uit vakbedrijven_merged_enriched_openai_clean_qc.json zonder LLM-categorie of bron-categorie. Niet geïmporteerd. Voeg later toe via handmatige curatie of een nieuwe LLM-pas.',
      _generated_at: new Date().toISOString(),
      _count: archive.length,
      records: archive,
    },
    null,
    2,
  ),
  'utf8',
)

const importedSize = JSON.stringify(imported).length
const archiveSize = JSON.stringify(archive).length

console.log('=== Geschreven ===')
console.log(
  `  ${OUTPUT_PATH}\n  → ${imported.length} records, ${(importedSize / 1024 / 1024).toFixed(2)} MB`,
)
console.log(
  `  ${ARCHIVE_PATH}\n  → ${archive.length} records, ${(archiveSize / 1024 / 1024).toFixed(2)} MB`,
)
console.log()
console.log('=== Vakgebied verdeling ===')
const sortedSlugs = [...perVakgebied.entries()].sort((a, b) => a[0].localeCompare(b[0]))
for (const [slug, n] of sortedSlugs) {
  console.log(`  ${slug.padEnd(18)} ${n.toString().padStart(5)}`)
}
console.log(`  ${'TOTAAL'.padEnd(18)} ${imported.length.toString().padStart(5)}`)

console.log()
console.log('=== Skip-redenen ===')
const sortedReasons = [...skipReasons.entries()]
  .filter(([r]) => !r.startsWith('mapped:'))
  .sort((a, b) => b[1] - a[1])
for (const [reason, n] of sortedReasons) {
  console.log(`  ${reason.padEnd(40)} ${n.toString().padStart(5)}`)
}
