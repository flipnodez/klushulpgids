# Fase 5 — Completion Report

**Status:** ✅ Code compleet, lokaal geverifieerd (`type-check`, `lint`, `build` clean). Klaar voor productie-deploy + handmatige Search Console + Bing setup.
**Datum:** 2026-04-25

## Wat is gebouwd

### Schema.org JSON-LD library

`lib/schema.ts` — typed builders voor:

| Helper                 | Toegepast op                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `organizationSchema`   | Root layout (alle pagina's)                                                                  |
| `websiteSchema`        | Root layout — incl. SearchAction                                                             |
| `breadcrumbSchema`     | Vak, Vak×Stad, Vakman, Blog                                                                  |
| `itemListSchema`       | Vak×Stad (top 10 results)                                                                    |
| `localBusinessSchema`  | Vakman-profiel (incl. AggregateRating wanneer beschikbaar)                                   |
| `faqSchema`            | Vak, Vak×Stad                                                                                |
| `articleSchema`        | Blog-post                                                                                    |
| `collectionPageSchema` | Vakgebied-overzicht                                                                          |
| `howToSchema`          | Beschikbaar voor blog-categorie HOE_DOE_JE (nog niet aangewezen — wacht op redactionele tag) |

`components/seo/JsonLd.tsx` — server-rendered `<script type="application/ld+json">`, accepteert één object of een array.

### Metadata API

- **Root layout** (`app/layout.tsx`):
  - `metadataBase`, title-template `'%s | Klushulpgids'`, default description
  - Volledige OpenGraph (locale `nl_NL`, type website), Twitter Card
  - Verification via env: `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`
  - **Indexering AAN** (was `noindex` in Fase 1-4)
- **Vak×Stad**: dynamische title incl. count, OG-image via `/api/og?vak=...&stad=...`
- **Vakman**: bestaande metadata + JSON-LD LocalBusiness
- **Blog-post**: type `article`, publishedTime, author, OG cover image
- **Vakgebied**: title + canonical + (template) description

Alle pagina's: unieke `<title>`, canonical URL, OpenGraph compleet.

### Sitemap & Robots

- `app/sitemap.ts` — dynamische sitemap, ~7900 URLs:
  - Statics (10), 12 vakgebieden, 100 steden, 12 provincies, 1200 vak×stad, ~6500 vakman-profielen (qualityScore ≥ 30), blog-posts
  - `lastModified` van DB `updatedAt`, `changeFrequency` per type
- `app/robots.ts` — gedifferentieerde AI-strategie:
  - **Block (training):** GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider, Amazonbot, Applebot-Extended, AhrefsBot, SemrushBot, DotBot, MJ12bot
  - **Allow (search):** OAI-SearchBot, PerplexityBot, Claude-User, GoogleOther, Applebot
  - **Default:** `Allow: /` met `Disallow: /api`, `Disallow: /zoeken`
  - Sitemap-pointer: `https://klushulpgids.nl/sitemap.xml`
- `public/llms.txt` — expliciete AI-policy (training blocked, search allowed met attribution)

### OG-image generation

`app/api/og/route.tsx` — Next.js `ImageResponse` API (edge runtime), 1200×630.

Editorial layout:

- Cream background `#F7F3EC`, accent red `#B91C1C`, ink `#1A1A1A`
- Em-dash kicker label boven, headline groot serif midden, footer met `klushulpgids.nl · Geen lead-fee · KvK-geverifieerd`
- Query-params: `vak`, `stad`, `title`, `kicker` — auto-shrink van font bij lange titels

Toegepast in metadata van `/[vak]/[stad]`. Eenvoudig uit te breiden naar /[vak] en /vakman.

### Caching

`lib/cache.ts` — `cached(key, ttl, fn)` read-through helper:

- Lazy-init `ioredis`-client; **graceful no-op** als `REDIS_URL` ontbreekt of Redis down is
- `invalidate(key)` + `invalidatePattern(glob)` voor data-imports

Toegepast op `/[vak]/[stad]` voor de niet-filter-afhankelijke queries:

- `vak-stad:stats:<vak>:<stad>` (TTL 1h)
- `vak-stad:specialties:<vak>:<stad>` (TTL 1h)
- `vak-stad:related-trades:<cityId>:<tradeId>` (TTL 1h)
- `vak-stad:nearby-cities:<cityId>` (TTL 24h)

Productie-activatie: `scalingo addons-add redis redis-sandbox` → `REDIS_URL` automatisch geïnjecteerd.

### Lighthouse CI

`.github/workflows/lighthouse.yml` — draait op iedere PR naar `main`, audit op 5 production URLs (homepage, vakgebied, vak×stad, blog, over-ons). `.lighthouserc.json` thresholds:

- Performance ≥ 0.85 (warn)
- Accessibility ≥ 0.95 (error)
- SEO ≥ 0.95 (error)
- Best-practices ≥ 0.95 (warn)

## Niet in scope deze fase

- Auto-internal-linking voor blog (Fase 5.13 in spec) — wacht op meer redactionele content; nu zou het noise zijn met 3 blog-posts
- Schema validation in CI script (5.11) — Lighthouse SEO-score dekt de basics; uitgebreide schema-validation pas relevant bij meer page-types
- Yandex Webmaster (laag-prio voor NL-markt)
- Hard performance-thresholds (Lighthouse Performance op `error`) — eerst week 1 metrics zien op productie

## Verificatie

```bash
npm run type-check  # ✅
npm run lint        # ✅ (1 stale eslint-disable opgeschoond)
npm run build       # ✅ 23 routes, alle pagina's gegenereerd
```

Build-output bevestigt:

- `/api/og` als dynamic edge-route
- `/sitemap.xml` als statische output (revalidated via ISR-onderlaag)
- `/robots.txt` statisch

## Handmatige stappen na deploy

Zie `docs/seo-setup.md` voor:

1. Google Search Console — DNS-verification + sitemap submit
2. Bing Webmaster — import vanuit GSC
3. Plausible event-tracking verifiëren
4. OG-image preview testen (opengraph.xyz, Twitter card validator)
5. Schema validation via Google Rich Results Test (4 page-types)
6. AI-crawler robots-strategie verifiëren (`curl -A GPTBot`)
7. Redis addon activeren in Scalingo
8. Lighthouse CI eerste run reviewen

## Acceptatie-criteria status

| Criterium                                                |             Status             |
| -------------------------------------------------------- | :----------------------------: |
| Elke pagina unieke title + meta description              |               ✅               |
| Canonical URLs aanwezig                                  |               ✅               |
| OpenGraph compleet                                       |               ✅               |
| Twitter Card aanwezig                                    |               ✅               |
| Homepage: Organization + WebSite                         |               ✅               |
| Vakgebied: BreadcrumbList + FAQPage                      |               ✅               |
| Vak×Stad: BreadcrumbList + ItemList + FAQPage            |               ✅               |
| Vakman: BreadcrumbList + LocalBusiness + AggregateRating |    ✅ (rating conditional)     |
| Blog: BreadcrumbList + Article                           |               ✅               |
| `/sitemap.xml` met alle URLs                             |               ✅               |
| `/robots.txt` gedifferentieerd                           |               ✅               |
| `/llms.txt` aanwezig                                     |               ✅               |
| Redis caching infrastructuur                             | ✅ (graceful zonder REDIS_URL) |
| Lighthouse CI workflow                                   |               ✅               |
| Indexering AAN in productie                              |               ✅               |
| Google Search Console verified + sitemap submitted       |           ⏳ founder           |
| Bing Webmaster verified                                  |           ⏳ founder           |
| Lighthouse Performance > 85 / SEO > 95                   |     ⏳ post-deploy meting      |

## Volgende fase

Phase 6 — Auth & vakman dashboard. Voorvereisten:

- Phase 5 acceptatie-criteria ✅
- Founder-validatie van Search Console submission + eerste indexering (week 1)
