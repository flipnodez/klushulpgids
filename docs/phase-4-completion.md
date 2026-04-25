# Fase 4 — Completion Report

**Status:** ✅ Code compleet, lokaal geverifieerd. Klaar voor productie deploy.
**Datum:** 2026-04-25

## Wat is gebouwd

### 19 routes (alle in `app/(public)/`)

| Route               | Doel                                                          |
| ------------------- | ------------------------------------------------------------- |
| `/`                 | Homepage — hero, categorieën, steden, top vakmensen, blog     |
| `/[vak]`            | Vakgebied-overzicht — steden-lijst met counts + top vakmensen |
| `/[vak]/[stad]`     | **KERNPAGINA** — listings met filter + sort + paginering      |
| `/vakman/[slug]`    | Vakman-profiel — hero, contact, certs, reviews, related       |
| `/plaats/[stad]`    | Stad-overzicht — vakgebieden + top + naburige steden          |
| `/provincie/[slug]` | Provincie-overzicht — steden + vakgebieden                    |
| `/zoeken`           | Search — redirect bij exacte match, anders fuzzy results      |
| `/blog`             | Blog-index met categorie-filter + paginering                  |
| `/blog/[slug]`      | Blog-post — markdown body + drop-cap + related                |
| `/steden`           | Alle 100 steden, gegroepeerd per provincie                    |
| `/vakgebieden`      | Alle 12 vakgebieden                                           |
| `/provincies`       | Alle 12 provincies                                            |
| `/over-ons`         | Editorial — werkwijze + redactionele principes                |
| `/voor-vakmensen`   | Landingspagina voor profiel-claims                            |
| `/contact`          | Contact-info + JSON-LD ContactPage                            |
| `/privacy`          | Privacy­verklaring (concept — founder reviewt)                |
| `/voorwaarden`      | Algemene voorwaarden (concept — founder reviewt)              |
| `/cookies`          | Cookies-toelichting (cookieless)                              |
| `/_not-found`       | Editorial 404                                                 |

### Layouts + error states

- `app/layout.tsx` — root HTML layout met fonts + Plausible script
- `app/(public)/layout.tsx` — wrapper met Header + Footer + skip-link
- `app/(public)/loading.tsx` — editorial skeleton-state
- `app/(public)/error.tsx` — editorial fallback met retry-knop
- `app/not-found.tsx` — editorial 404 met suggestion-links

### Library extensions

- `lib/queries/cities.ts` — `getCitiesWithTradeCount()`, `getNearbyCities()`,
  `getTopCities()` met raw SQL voor groupBy + grootcirkel-afstand
- `lib/queries/trades.ts` — `getAllTradesWithCount()`, `getRelatedTradesInCity()`,
  `getTradesInCity()`
- `lib/queries/tradespeople.ts` — uitgebreid met `getTopTradespeople()`,
  `getTopTradespeopleByTrade()`, `getRelatedTradespeople()`,
  `getVakCityStats()`, `getSpecialtiesForVakAndCity()`, plus filter+sort logic
- `lib/queries/blog.ts` — full CRUD: list, count, by-slug, by-trade, related
- `lib/provinces.ts` — vaste mapping NL provincies (geen DB-query nodig)
- `lib/track.ts` — Plausible client-side event helper (no-op in SSR)

### Plausible analytics

Script geladen via `next/script` met `defer` + `afterInteractive` strategie,
alleen wanneer `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env var gezet is. Helper
`lib/track.ts` voor 7 custom events: Telefoon Klik, E-mail Klik, Website Klik,
Profiel Bekeken, Zoekterm, Filter Gebruikt, Blog Gelezen.

### Cookie-notice

In de Footer, conform AVG: "Wij gebruiken alleen functionele cookies en
privacy-vriendelijke bezoekersstatistieken (Plausible). Geen tracking." Geen
banner-modal nodig.

### Server-side filtering via URL

`/[vak]/[stad]` accepteert query params voor filter + sort + paginering.
Form submit = GET-method, dus URL is bookmarkable en shareable. Geen JS
nodig op de client; alle filter-logica draait server-side.

## Lokaal geverifieerd

| Check                  | Resultaat                                    |
| ---------------------- | -------------------------------------------- |
| `npm run type-check`   | ✅ no errors                                 |
| `npm run lint`         | ✅ no errors                                 |
| `npm run format:check` | ✅                                           |
| `npm run build`        | ✅ 19 routes, 102-112 kB First Load JS       |
| `npm test`             | ✅ 30/30 passing (geen regressie tov fase 3) |

## Acceptatie-criteria

### Functioneel ✅

- [x] Homepage toont echte data (categorieën, steden, top vakmensen)
- [x] `/loodgieters` toont overzicht met steden-counts
- [x] `/loodgieters/amsterdam` toont gefilterde resultaten met paginatie
- [x] Filters werken (beschikbaarheid, rating, specialisme)
- [x] Sortering werkt (quality/rating/recent)
- [x] Vakman-profiel toont alle data (over/specs/certs/reviews)
- [x] Stad-pagina toont vakgebieden met counts
- [x] Provincie-pagina toont steden in provincie
- [x] Blog-index + blog-post werken
- [x] Statische pagina's renderen
- [x] 404-pagina toont editorial design
- [x] Search-component → navigeert correct (redirect bij match)
- [x] Plausible script + lib/track.ts (events firing afhankelijk van prod env var)
- [ ] Server-side PageView events — uitgesteld naar fase 7 (admin-analytics)

### Visueel ✅

- [x] Alle pagina's volgen design-system (geen rounded, geen emoji)
- [x] Em-dash labels op alle relevante secties
- [x] One-italic-word pattern in H1's (loodgieters in _Amsterdam_, etc.)
- [x] Drop-caps in editorial body-paragrafen
- [x] Light + dark mode werkt (via design-tokens, getest in fase 3)
- [x] Mobile responsive (CSS grid + flex met breakpoints)

### Technisch ✅

- [x] Type-check + lint + build passes
- [x] ISR werkt (revalidate per pagina conform docs/routes.md)
- [x] Alle pagina's server-rendered (geen client-only data)
- [x] Geen hydration errors (alle interactive UI server-rendered + form-submit)
- [x] Geen 404 errors voor statische assets

### SEO basis ✅

- [x] Elke pagina heeft unieke `<title>` en `<meta description>`
- [x] H1 één per pagina, correct hiërarchie (h1 → h2 → h3)
- [x] Image alt-texts overal aanwezig (BlogCard cover)
- [x] `lang="nl"` op html element
- [x] Canonical URLs in `metadata.alternates.canonical`
- [x] BreadcrumbList JSON-LD via `Breadcrumbs` component
- [x] OpenGraph metadata op blog-posts
- [ ] `robots: index: false` blijft TIJDELIJK aan tot fase 5 sitemap af is

## Afwijkingen van de prompt

| Onderdeel                             | Wijziging                                                                | Reden                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Map view (Leaflet) op `/[vak]/[stad]` | NIET geïmplementeerd                                                     | Heavy client component (Leaflet bundle ~150kb); past beter na fase 5 SEO-pas. Lat/lng staan al in DB klaar via `City` coordinaten          |
| Filter-sidebar als modal op mobile    | Eenvoudige form met flex-wrap                                            | Server-rendered form werkt overal; modal komt in fase 5 UX-pas                                                                             |
| Server-side `PageView` opslag         | Uitgesteld naar fase 7                                                   | Plausible levert real-time geaggregeerd; per-vakman dashboard-stats heeft pas waarde wanneer admin/dashboard live is                       |
| Blog body auto-link scan              | NIET geïmplementeerd                                                     | Vereist NLP-achtige logic; uitgesteld naar fase 5                                                                                          |
| `robots: index: true`                 | Blijft `false` tot fase 5                                                | Zonder sitemap.xml + complete schema.org indexing premature; pas in fase 5 zetten we de "open the door" aan                                |
| ContactBlock e-mail in profiel        | `email={null}` — alleen telefoon en website                              | E-mail is encrypted in DB; ontsluiting via dashboard (fase 6) — dit voorkomt dat we nu een `decrypt()` op een server-page moeten doen      |
| Vakman-profiel "Tabs"                 | Single-page sections ipv tabbed UI                                       | Tabs vereisen client-state (radix-ui o.i.d.); single page is server-renderbaar en toegankelijker. Visueel onderscheiden via em-dash labels |
| Cookie banner                         | Footer-melding ipv banner-modal                                          | Plausible is cookieless en vereist geen consent-banner — een korte melding in de footer is voldoende AVG-bescherming                       |
| `/zoeken` full-text via pg_trgm       | `contains` + `hasSome` ipv pg_trgm extension                             | pg_trgm vereist `CREATE EXTENSION` op productie; voor 2K records is `contains` snel genoeg. Switch naar pg_trgm komt bij groei van dataset |
| One-italic-word per H1                | Per-pagina handmatig (Amsterdam, makelaar, twaalf, gids, redactie, etc.) | Geen automatische extractie; bewuste editorial keuze per pagina                                                                            |
| `searchTradespeople` met "vak stad"   | Concat van vak + plaats inputs als query string                          | Geeft bredere matches; bij exacte matches volgt redirect zodat user op de "echte" pagina belandt                                           |

## Aandachtspunten voor fase 5

- **Sitemap.xml** moet alle 19 routes + alle vak×stad combinaties (12 × 100 = 1.200 pagina's) bevatten — generate via `next-sitemap` of custom `app/sitemap.ts`
- **Schema.org**: `LocalBusiness` op `/vakman/[slug]`, `BreadcrumbList` werkt al, `FAQPage` op `/voor-vakmensen`, `Article` op `/blog/[slug]`
- **`robots: index: true`** zetten op alle pagina's behalve `/zoeken`
- **Lighthouse-optimization**: image lazy-loading checks, font preload, CLS-scores
- **Map view** op vak/stad-pagina's met Leaflet + OSM-tiles (fase 5 als nice-to-have)
- **Auto-interne links in blog body**: scan op vak/stad-namen, wrap in `<Link>` (fase 5)
- **Theme-toggle in Header**: vereist client-state + localStorage; uitgesteld omdat er nog geen sterke gebruikersbehoefte is. Kan ook fase 6 worden bij dashboard-implementatie
- **Mobile menu** (hamburger collapse): de huidige nav wraps op smal scherm maar is niet collapsible. Cosmetic, geen blokker
- **`react-markdown` security**: standaard sanitized; bij blog-import in fase 7 (admin) check of we extra sanitization willen voor user-content

## Wat te checken op productie deploy

Na de push:

1. `https://klushulpgids.nl/` toont nieuwe homepage met data (was placeholder hero)
2. `https://klushulpgids.nl/loodgieters` toont steden-lijst met counts
3. `https://klushulpgids.nl/loodgieters/amsterdam` toont listings (mogelijk leeg op productie tot seed daar gedraaid is — check `count`)
4. Klik op een vakman → profielpagina laadt
5. Klik op `/blog` → leeg overzicht (geen blog posts in DB)
6. Plausible script laadt zodra `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` op Scalingo gezet is
