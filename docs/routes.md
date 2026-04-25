# Routes overview

19 routes gebouwd in fase 4. Alle pagina's onder `app/(public)/` met gedeelde
Header + Footer via `app/(public)/layout.tsx`.

## Publieke routes

| Pad                 | Bestand                              | Type    | Revalidate | Doel                                                                |
| ------------------- | ------------------------------------ | ------- | ---------- | ------------------------------------------------------------------- |
| `/`                 | `(public)/page.tsx`                  | Static  | 1 uur      | Homepage — hero, vakgebieden, steden, top vakmensen, redactie, blog |
| `/[vak]`            | `(public)/[vak]/page.tsx`            | Dynamic | 6 uur      | Vakgebied-overzicht — steden-counts + top vakmensen + blog          |
| `/[vak]/[stad]`     | `(public)/[vak]/[stad]/page.tsx`     | Dynamic | 1 uur      | **KERNPAGINA** — listings + filters + paginering + lokale content   |
| `/vakman/[slug]`    | `(public)/vakman/[slug]/page.tsx`    | Dynamic | 30 min     | Vakman-profiel — hero, contact, certs, reviews, related             |
| `/plaats/[stad]`    | `(public)/plaats/[stad]/page.tsx`    | Dynamic | 6 uur      | Stad-overzicht — vakgebieden in stad, top, naburige steden          |
| `/provincie/[slug]` | `(public)/provincie/[slug]/page.tsx` | Dynamic | 6 uur      | Provincie-overzicht — steden + vakgebieden                          |
| `/zoeken`           | `(public)/zoeken/page.tsx`           | Dynamic | n/a        | Zoekresultaten — redirect naar /[vak]/[stad] bij exact match        |
| `/blog`             | `(public)/blog/page.tsx`             | Dynamic | 30 min     | Blog-index met categorie-filter + paginering                        |
| `/blog/[slug]`      | `(public)/blog/[slug]/page.tsx`      | Dynamic | 30 min     | Blog-post — markdown body + drop-cap + related                      |
| `/steden`           | `(public)/steden/page.tsx`           | Static  | 24 uur     | Alle 100 steden, gegroepeerd per provincie                          |
| `/vakgebieden`      | `(public)/vakgebieden/page.tsx`      | Static  | 24 uur     | Alle 12 vakgebieden                                                 |
| `/provincies`       | `(public)/provincies/page.tsx`       | Static  | 24 uur     | Alle 12 provincies                                                  |
| `/over-ons`         | `(public)/over-ons/page.tsx`         | Static  | n/a        | Editorial — werkwijze + redactionele principes                      |
| `/voor-vakmensen`   | `(public)/voor-vakmensen/page.tsx`   | Static  | n/a        | Landingspagina voor profiel-claims (link naar /inloggen — fase 6)   |
| `/contact`          | `(public)/contact/page.tsx`          | Static  | n/a        | Contact-info + JSON-LD ContactPage schema                           |
| `/privacy`          | `(public)/privacy/page.tsx`          | Static  | n/a        | Privacy­verklaring (concept)                                        |
| `/voorwaarden`      | `(public)/voorwaarden/page.tsx`      | Static  | n/a        | Algemene voorwaarden (concept)                                      |
| `/cookies`          | `(public)/cookies/page.tsx`          | Static  | n/a        | Cookies-toelichting (cookieless via Plausible)                      |
| `/_not-found`       | `app/not-found.tsx`                  | Static  | n/a        | Editorial 404                                                       |

## Loading & error states

- `app/(public)/loading.tsx` — editorial skeleton-state (geen rounded shapes)
- `app/(public)/error.tsx` — editorial fallback met retry-knop

## Revalidate-strategie

| Frequentie van data-changes              | revalidate | Pagina's                                        |
| ---------------------------------------- | ---------- | ----------------------------------------------- |
| Statisch (geen DB)                       | n/a        | `/over-ons`, `/contact`, juridisch              |
| Schema/seed data (12 trades, 100 steden) | 24 uur     | `/steden`, `/vakgebieden`, `/provincies`        |
| Profiel-updates (claims, reviews)        | 30 min     | `/vakman/[slug]`, `/blog/*`                     |
| Aggregaten (counts per vak/stad)         | 1 uur      | `/`, `/[vak]/[stad]`                            |
| Categorie-overzichten                    | 6 uur      | `/[vak]`, `/plaats/[stad]`, `/provincie/[slug]` |

## Filters via URL (geen JS nodig)

`/[vak]/[stad]` ondersteunt server-side filtering via query params:

| Param         | Waarden                                                                |
| ------------- | ---------------------------------------------------------------------- |
| `pagina`      | Integer ≥ 1                                                            |
| `sort`        | `quality` (default), `rating`, `recent`                                |
| `beschikbaar` | `AVAILABLE_NOW`, `AVAILABLE_THIS_WEEK`, `AVAILABLE_THIS_MONTH` (multi) |
| `rating`      | `3`, `4`, `4.5` (min. rating)                                          |
| `specialisme` | Vrije tekst — moet exact in `Tradesperson.specialties[]`               |

Form submission gebruikt GET-method zodat de URL bookmarkable + shareable is.

## Plausible analytics

Script wordt geladen in `app/layout.tsx` zodra `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
is gezet. Helper `lib/track.ts` voor client-side custom events:

| Event             | Wanneer firen                                          | Props             |
| ----------------- | ------------------------------------------------------ | ----------------- |
| `Telefoon Klik`   | Klik op `tel:` link in TradespersonCard / ContactBlock | vakman, vak, stad |
| `E-mail Klik`     | Klik op `mailto:` link                                 | vakman            |
| `Website Klik`    | Klik op externe website-link                           | vakman            |
| `Profiel Bekeken` | Pageview op `/vakman/[slug]`                           | vakman, tier      |
| `Zoekterm`        | Zoek-form submit op `/zoeken`                          | vak, stad         |
| `Filter Gebruikt` | Filter-form submit op `/[vak]/[stad]`                  | filter-naam       |
| `Blog Gelezen`    | Pageview op `/blog/[slug]`                             | slug, categorie   |

> Server-side `PageView`-records (in DB-tabel) worden in fase 7 geïmplementeerd
> wanneer de admin analytics nodig heeft. Plausible voor real-time geaggregeerd,
> DB voor per-vakman dashboard-stats.

## Toekomstige routes (latere fases)

| Pad               | Fase | Doel                                          |
| ----------------- | ---- | --------------------------------------------- |
| `/inloggen`       | 6    | Magic link auth                               |
| `/dashboard/*`    | 6    | Vakman-dashboard (claim, profiel, foto's)     |
| `/admin/*`        | 7    | Admin (review-moderatie, blog CMS)            |
| `/api/revalidate` | 5    | On-demand revalidate webhook                  |
| `/sitemap.xml`    | 5    | Dynamic sitemap met alle vak/stad combinaties |
| `/robots.txt`     | 5    | Met `Allow: /` zodra we klaar zijn voor SEO   |

## Out-of-scope items uit fase-4 prompt (gepland later)

- **Map view (Leaflet)** op `/[vak]/[stad]` — heavy client component, komt in fase 5+ als de listings écht volwassen zijn
- **Server-side `PageView` opslag** — fase 7
- **`react-markdown` GFM-tabellen testen** — fase 5
- **Auto-interne links in blog body** (scan op vak/stad-namen) — fase 5
- **Filter-sidebar als modal op mobile** — huidige `<form>` werkt al server-side, modal komt bij UX-pas in fase 5
