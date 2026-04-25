# Database

PostgreSQL schema, migrations en query-laag voor Klushulpgids.nl.

## Stack

- **Database**: PostgreSQL 16
- **ORM**: Prisma 6.19
- **Encryption**: AES-256-GCM (Node.js `crypto`) — voor PII (email)
- **Hosting**: Scalingo addon `postgresql:postgresql-starter-512` (productie),
  Postgres.app of Docker Compose (lokaal)

## Tabellen overzicht

| Categorie            | Tabel                                             | Wat                                                    |
| -------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| Core                 | `Trade`                                           | 12 vakgebieden (loodgieters, elektriciens…)            |
|                      | `City`                                            | Top 100 NL steden + provincie + lat/lng + populatie    |
|                      | `Tradesperson`                                    | Vakman (~25 velden), gekoppeld aan stad en trades      |
|                      | `TradespersonTrade`                               | Pivot vakman ↔ trade, met SBI-code metadata           |
|                      | `TradespersonServiceArea`                         | Pivot vakman ↔ stad waarin actief                     |
| Erkenningen          | `Certification`                                   | VCA, KIWA, InstallQ, etc.                              |
|                      | `IndustryAssociation`                             | Techniek Nederland, Bouwend Nederland, etc.            |
|                      | `TradespersonCertification`                       | Pivot                                                  |
|                      | `TradespersonAssociation`                         | Pivot                                                  |
| Reviews              | `Review`                                          | Eigen reviews (gemodereerd)                            |
|                      | `TradespersonReviewSource`                        | Externe review-platforms (Klantenvertellen, Google)    |
| Media                | `TradespersonPhoto`                               | Foto's via Scaleway/Exoscale storage (vanaf fase 6)    |
| Content              | `BlogPost`                                        | Editorial content met FAQ + HowTo schema               |
| Auth (fase 6)        | `User`, `Account`, `Session`, `VerificationToken` | NextAuth schema                                        |
| Analytics            | `PageView`                                        | Event-tracking per vakman (PROFILE_VIEW, PHONE_CLICK…) |
| Compliance           | `OptOutBlacklist`                                 | KvK/email die expliciet uit de gids willen             |
|                      | `ComplianceLog`                                   | Audit-trail voor GDPR-events                           |
| Monetisatie (fase 8) | `Payment`, `Sponsorship`                          | Mollie payments + sponsoring slots                     |

Volledige veld-lijst staat in [`prisma/schema.prisma`](../prisma/schema.prisma).

## Quality score

`Tradesperson.qualityScore` is een 0-100 getal, herberekend bij elke import.
Gebruikt voor sortering op category-pagina's. Berekening:

| Criterium                | Punten  |
| ------------------------ | ------- |
| KvK-nummer aanwezig      | +20     |
| Beschrijving > 100 chars | +10     |
| Telefoonnummer           | +10     |
| Website                  | +10     |
| Email                    | +10     |
| ≥ 1 certificering        | +15     |
| ≥ 1 branchevereniging    | +10     |
| Google reviews > 5       | +10     |
| Specialisaties aanwezig  | +5      |
| **Maximum**              | **100** |

Implementatie: [`scripts/import-sample-data.ts`](../scripts/import-sample-data.ts) `calcQualityScore()`.

## Encryption

**Welke velden zijn versleuteld?**

| Tabel.veld                 | Type                    | Reden                                                         |
| -------------------------- | ----------------------- | ------------------------------------------------------------- |
| `Tradesperson.email`       | Encrypted (AES-256-GCM) | Eigenaar moet 'm kunnen zien (dashboard fase 6); publiek niet |
| `Tradesperson.emailHash`   | sha256 hex              | Voor dedup + lookups zonder plaintext                         |
| `Review.reviewerEmailHash` | sha256 hex              | Anti-spam dedup                                               |
| `Review.ipAddressHash`     | sha256 hex              | Anti-spam zonder IP plaintext                                 |

**Format**: `iv:tag:ciphertext` — drie hex-strings gescheiden door `:`.

- IV: 12 bytes random per encryptie (24 hex chars)
- Tag: GCM authentication tag (32 hex chars)
- Ciphertext: variable length

**Sleutel**: `ENCRYPTION_KEY` env var, 64 hex chars (32 bytes).
Genereer met:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

⚠ **Verlies van `ENCRYPTION_KEY` = data permanent onleesbaar.** Bewaar altijd
back-up in een password manager. Bij rotatie: re-encrypt alle velden in een
migration-script (out-of-scope voor fase 2).

## Workflow

### Lokaal — eerste setup

```bash
# 1. Postgres aan (kies één)
#    Optie A: Postgres.app (zie docs/local-db.md)
#    Optie B: docker compose up -d

# 2. .env.local aanmaken (zit al in repo, niet committen)
cp .env.example .env.local   # vervolgens DATABASE_URL invullen

# 3. Schema toepassen + lokaal client genereren
npm run db:migrate            # = prisma migrate dev

# 4. Trades + cities seeden
npm run db:seed               # = tsx prisma/seed.ts

# 5. Sample data importeren (vakbedrijven_merged.json, ~11K records, ~5 min)
npm run db:import             # = tsx scripts/import-sample-data.ts
# Of een subset:
npm run db:import -- --limit=200

# 6. Verifieer
npm run db:test               # = tsx scripts/test-db.ts
```

### Schema wijzigen

```bash
# 1. Bewerk prisma/schema.prisma
# 2. Genereer migration + apply lokaal
npm run db:migrate -- --name <descriptive_name>
# 3. Commit prisma/migrations/<timestamp>_<name>/
# 4. Push → Scalingo runt `prisma migrate deploy` automatisch via release.sh
```

### Productie — eenmalige seed/import

```bash
# Vereist: scalingo CLI geïnstalleerd (zie docs/setup.md §9)
scalingo --app klushulpgids run "npx tsx prisma/seed.ts"
scalingo --app klushulpgids run "npx tsx scripts/import-sample-data.ts"

# Of via Scalingo dashboard: One-off Container → typ commando
```

`prisma migrate deploy` runt al automatisch op elke deploy (zie
[`scripts/release.sh`](../scripts/release.sh)).

## Indexen

Belangrijke indexen voor performance (fase 4 listings):

| Index                                        | Reden                              |
| -------------------------------------------- | ---------------------------------- |
| `Tradesperson.slug` (unique)                 | URL-lookup per vakman              |
| `Tradesperson.cityId`                        | "Vakmensen in Amsterdam"           |
| `Tradesperson.qualityScore desc`             | Default sort op listings           |
| `Tradesperson.featured`                      | Filtering featured listings        |
| `Tradesperson.tier`                          | Tier-gebaseerde sortering (fase 8) |
| `Tradesperson.boostScore desc`               | Sponsoring boost (fase 8)          |
| `Tradesperson.ratingAvg desc`                | Sortering op rating                |
| `City.slug`, `Trade.slug`                    | URL-lookups                        |
| `City.province`                              | Provincie-views                    |
| `Review.tradespersonId` + `Review.status`    | Listings per vakman                |
| `BlogPost.slug`, `BlogPost.publishedAt desc` | Blog-pagina's                      |

## Trouble­shooting

### `migrate dev` faalt met "drift detected"

Lokale schema en migrations zijn uit sync. Reset:

```bash
npm run db:reset       # ⚠ Verwijdert ALLEEN lokale data
npm run db:migrate
```

### Prisma client mist types na schema-wijziging

```bash
npm run db:generate
```

Of: `npm install` — `postinstall` hook draait automatisch `prisma generate`.

### Productie migration faalt bij deploy

Logs: `scalingo --app klushulpgids logs --filter release`

Meestal twee redenen:

1. Migration verwijst naar tabel die al data heeft (DROP COLUMN met data)
2. Migration drift tussen lokaal en productie

Oplossing: bekijk `_prisma_migrations` tabel in productie, vergelijk met
`prisma/migrations/` map. Zo nodig: `prisma migrate resolve --applied
<migration_name>` om handmatig te markeren.
