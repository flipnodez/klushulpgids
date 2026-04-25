# Fase 2 — Completion Report

**Status:** ✅ Code compleet, klaar voor Scalingo migrate deploy + lokale verificatie
**Datum:** 2026-04-25

## Wat is gebouwd

### Database & schema

- `prisma/schema.prisma` — 24 modellen + 11 enums (1:1 conform fase-2 prompt)
  - Core: `Trade`, `City`, `Tradesperson` + pivots `TradespersonTrade`,
    `TradespersonServiceArea`
  - Erkenningen: `Certification`, `IndustryAssociation` + pivots
  - Reviews: `Review`, `TradespersonReviewSource`
  - Media: `TradespersonPhoto`
  - Content: `BlogPost`
  - Auth (klaar voor fase 6): `User`, `Account`, `Session`, `VerificationToken`
  - Analytics: `PageView`
  - Compliance: `OptOutBlacklist`, `ComplianceLog`
  - Fase 8 placeholders: `Payment`, `Sponsorship`
- Initial migration in `prisma/migrations/0001_initial_schema/migration.sql`
  (584 regels SQL, gegenereerd via `prisma migrate diff` zonder lokale DB)
- `prisma/migrations/migration_lock.toml` met provider=postgresql

### Libraries

| Bestand                | Wat                                                           |
| ---------------------- | ------------------------------------------------------------- |
| `lib/db.ts`            | Prisma client singleton met dev-HMR-bescherming               |
| `lib/encryption.ts`    | AES-256-GCM encrypt/decrypt + sha256 hash (server-only)       |
| `lib/env.ts`           | Zod env-validatie, fase-2 strikter (DATABASE_URL verplicht)   |
| `lib/queries/index.ts` | Re-export van alle query-modules                              |
| `lib/queries/*.ts`     | Getypeerde queries voor tradespeople, cities, trades, reviews |

### Seed & import

- `prisma/seed.ts` — upsert 12 trades + 100 NL steden (idempotent)
- `prisma/seed-data/trades.ts` — 12 vakgebieden uit `data.js` + SEO-templates
- `prisma/seed-data/cities.ts` — 100 NL steden met provincie + lat/lng + populatie
- `scripts/import-sample-data.ts` — import van `vakbedrijven_merged.json`:
  - Idempotent (upsert op `kvkNumber` of `(sourceName, sourceId)`)
  - Trade-matching via `zoekterm` (regex) + SBI-codes (lookup table)
  - City-matching op slug (case-insensitive normalisatie)
  - Email AES-encryptie + sha256 hash voor lookup
  - Quality score 0-100 conform fase-2 prompt §2.7
  - Cert/branchevereniging upsert + pivot link
  - Review-bronnen import
  - CLI flags: `--file=`, `--limit=`, `--dry-run`
  - Verwachte runtime: ~5 min voor 11K records (lokaal)
- `scripts/test-db.ts` — health check: connectie, counts, sample query,
  encryption roundtrip, unique-constraint test

### Tooling

- `docker-compose.yml` — Postgres 16 + Redis 7 voor lokale dev
- `docs/local-db.md` — Postgres.app of Docker Compose setup-stappen
- `docs/database.md` — schema-overzicht, quality score, encryption, workflows
- `package.json` scripts:
  - `db:generate`, `db:migrate`, `db:migrate:deploy`, `db:reset`, `db:studio`
  - `db:seed`, `db:test`, `db:import`
  - `postinstall: prisma generate` (zorgt dat client altijd in sync is)
- `.env.local` met dev `DATABASE_URL`, `REDIS_URL`, gegenereerde
  `ENCRYPTION_KEY` + `REVALIDATE_SECRET` (NIET gecommit, in `.gitignore`)

## Lokaal geverifieerd

| Check                  | Resultaat               |
| ---------------------- | ----------------------- |
| `prisma validate`      | ✅                      |
| `prisma generate`      | ✅                      |
| `npm run type-check`   | ✅                      |
| `npm run lint`         | ✅                      |
| `npm run format:check` | ✅                      |
| `npm run build`        | ✅ 102 kB First Load JS |

> Fase-1 acceptatie blijft groen: hero pagina bouwt ongewijzigd, alleen
> dependencies en `lib/db.ts` veranderden.

## Nog te doen — wacht op lokale Postgres

Postgres lokaal is **nog niet** geïnstalleerd. Pas na install kunnen deze
acceptatie-criteria gevalideerd worden:

| Check                          | Hoe te runnen                      |
| ------------------------------ | ---------------------------------- |
| Migration applied lokaal       | `npm run db:migrate`               |
| Trades + cities seeded         | `npm run db:seed` → 12 + 100       |
| 200+ tradespeople geïmporteerd | `npm run db:import -- --limit=200` |
| Health check                   | `npm run db:test` → ✅ healthy     |

Zie [`docs/local-db.md`](./local-db.md) voor de twee setup-opties (Postgres.app
of Docker Compose).

## Productie deploy strategie

Op de eerste push naar `main` na deze commit:

1. Scalingo build draait `npm install` → `postinstall` runt `prisma generate`
2. Build runt `npm run build` (Next.js)
3. **Release-fase** runt `./scripts/release.sh` → `prisma migrate deploy` →
   schema toegepast op productie DB
4. Web-proces start: hero pagina blijft servereren

Na succes: zet `ENCRYPTION_KEY` in Scalingo env vars en trigger eenmalig de
seed + import:

```bash
scalingo --app klushulpgids env-set ENCRYPTION_KEY=$(openssl rand -hex 32)
scalingo --app klushulpgids run "npx tsx prisma/seed.ts"
scalingo --app klushulpgids run "npx tsx scripts/import-sample-data.ts --limit=500"
```

Zie [`docs/database.md`](./database.md#productie--eenmalige-seedimport).

## Afwijkingen van de prompt

| Onderdeel                  | Wijziging                                                              | Reden                                                                                                |
| -------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Prisma versie              | `6.19.3` (downgrade van 7.8.0)                                         | Prisma 7 vereist `prisma.config.ts` ipv `url` in schema; phase-2 prompt is voor 6-syntax             |
| Migration generatie        | `prisma migrate diff` ipv `migrate dev`                                | Geen lokale DB beschikbaar (Postgres niet geïnstalleerd); SQL toch deployable op productie           |
| `ENCRYPTION_KEY` validatie | `.optional()` in `lib/env.ts`                                          | Encryption.ts doet zelf strikte check at-use; voorkomt dat productie crasht voordat key gezet is     |
| `Geocoding`                | NIET via Nominatim (overgeslagen)                                      | 11K records × Nominatim rate-limit = uren werk; lat/lng leeg, fase 4 gebruikt `City` coords          |
| Database providers         | Postgres.app + Docker Compose beide gedocumenteerd                     | Brew is op deze Mac stuk (macOS 26.4 niet herkend); user-friendly alternatief                        |
| Trades count               | 12 (uit data.js)                                                       | Phase-2 zei "12+", we volgen exact data.js                                                           |
| Cities count               | 100 (top NL gemeenten op populatie)                                    | Phase-2 zei "100"                                                                                    |
| Bron-bestand               | `vakbedrijven_merged.json` (11K records) ipv `vakbedrijven_part3.json` | Founder voorkeur (uitgebreidere set)                                                                 |
| `data.js` import           | Vertaald naar TS-seed met SEO-templates                                | `data.js` is browser-prototype, niet importeerbaar in Node; trades + cities overgenomen + uitgebreid |

## Aandachtspunten voor fase 3

- `lib/queries/tradespeople.ts` `searchTradespeople()` doet `contains` queries
  zonder full-text index → fase 4/5 zal Postgres `tsvector` of `pg_trgm`
  toevoegen voor performance bij grote dataset
- `Tradesperson.latitude`/`longitude` zijn nu null voor alle geïmporteerde
  records — fase 4 distance-queries vallen terug op `City.latitude/longitude`
- Postgres-only features in schema: `String[]` arrays, enums — geen SQLite
  fallback mogelijk
- `_prisma_migrations` tabel wordt vanzelf aangemaakt door `migrate deploy` op
  productie; geen extra setup nodig
- Stale Postgres connections in serverless dev: lib/db.ts pinning op
  `globalThis` voorkomt dat
- Image-uploads (`TradespersonPhoto.url`) werken pas vanaf fase 6 wanneer
  S3-storage env vars gezet zijn
- Reviews-aggregaten (`ratingAvg`, `ratingCount`) worden pas in fase 7 bij
  review-submissie geüpdate; nu denormalized naar `googleRating`/`googleReviewsCount`
  alleen
