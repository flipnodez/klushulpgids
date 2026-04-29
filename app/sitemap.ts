import type { MetadataRoute } from 'next'

import { prisma } from '@/lib/db'
import { PROVINCES, provinceSlug } from '@/lib/provinces'

const BASE_URL = 'https://klushulpgids.nl'

/**
 * Dynamische sitemap.
 *
 * Inhoud:
 *  - Static pagina's (homepage + statische routes)
 *  - 12 vakgebied-overzichten (/[vak])
 *  - 100 stad-overzichten (/plaats/[stad])
 *  - 12 provincies (/provincie/[slug])
 *  - 1.200 vak × stad combinaties (12 × 100) — kernpagina's
 *  - Vakman-profielen met qualityScore ≥ 30 (~6.500 records)
 *  - Gepubliceerde blog-posts
 *
 * Verwacht totaal: ~7.900 URLs. Onder Next.js' 50K limit dus geen splitting.
 *
 * Wordt opnieuw gegenereerd bij elke deploy (geen revalidate). Voor
 * vakers updates: trigger handmatig een redeploy of voeg revalidate toe.
 */
// ISR: regenereer max 1× per uur. Voorkomt dat de DB op iedere request
// wordt aangeroepen (~7900 URLs is duur) én het maakt build-time-rendering
// optioneel — als de DB tijdens de build niet bereikbaar is (bv. CI zonder
// DATABASE_URL) krijgen we een minimale static sitemap, en wordt de volledige
// versie gegenereerd op de eerste request na deploy.
export const revalidate = 3600

type TradeRow = { slug: string; updatedAt: Date }
type CityRow = { slug: string; updatedAt: Date }
type TpRow = { slug: string; updatedAt: Date }
type PostRow = { slug: string; updatedAt: Date; publishedAt: Date | null }

async function fetchSitemapData(): Promise<{
  trades: TradeRow[]
  cities: CityRow[]
  tradespeople: TpRow[]
  posts: PostRow[]
}> {
  try {
    const [trades, cities, tradespeople, posts] = await Promise.all([
      prisma.trade.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.city.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.tradesperson.findMany({
        where: { qualityScore: { gte: 30 } },
        select: { slug: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { publishedAt: { not: null, lte: new Date() } },
        select: { slug: true, updatedAt: true, publishedAt: true },
      }),
    ])
    return { trades, cities, tradespeople, posts }
  } catch (err) {
    // Database unreachable (bv. CI build zonder DATABASE_URL) — log en
    // genereer een minimale sitemap met alleen statische pagina's.
    console.warn('[sitemap] DB-onbereikbaar, genereer minimale sitemap:', (err as Error).message)
    return { trades: [], cities: [], tradespeople: [], posts: [] }
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { trades, cities, tradespeople, posts } = await fetchSitemapData()

  const now = new Date()

  // ── Static pages ───────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    {
      url: `${BASE_URL}/vakgebieden`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    { url: `${BASE_URL}/steden`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    {
      url: `${BASE_URL}/provincies`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    {
      url: `${BASE_URL}/over-ons`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/voor-vakmensen`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/voorwaarden`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookies`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // ── Vakgebieden ──────────────────────────────────────────────────────
  const tradePages: MetadataRoute.Sitemap = trades.map((t) => ({
    url: `${BASE_URL}/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  // ── Steden ───────────────────────────────────────────────────────────
  const cityPages: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${BASE_URL}/plaats/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // ── Provincies ───────────────────────────────────────────────────────
  const provincePages: MetadataRoute.Sitemap = PROVINCES.map((p) => ({
    url: `${BASE_URL}/provincie/${provinceSlug(p)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // ── Vak × Stad — kernpagina's ─────────────────────────────────────────
  const vakStadPages: MetadataRoute.Sitemap = []
  for (const trade of trades) {
    for (const city of cities) {
      vakStadPages.push({
        url: `${BASE_URL}/${trade.slug}/${city.slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.9,
      })
    }
  }

  // ── Vakman-profielen ────────────────────────────────────────────────
  const vakmanPages: MetadataRoute.Sitemap = tradespeople.map((tp) => ({
    url: `${BASE_URL}/vakman/${tp.slug}`,
    lastModified: tp.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // ── Blog ─────────────────────────────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...tradePages,
    ...cityPages,
    ...provincePages,
    ...vakStadPages,
    ...vakmanPages,
    ...blogPages,
  ]
}
