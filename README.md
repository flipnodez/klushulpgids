# Klushulpgids.nl

Onafhankelijke gids voor Nederlandse vakmannen. Editorial krant-stijl,
EU-soevereine hosting, geen tracking-cookies. Gebouwd met Next.js 15,
PostgreSQL en Redis op Scalingo (osc-fr1, FR).

## Tech stack

| Component      | Keuze                              |
| -------------- | ---------------------------------- |
| Framework      | Next.js 15 (App Router) + React 19 |
| Taal           | TypeScript (strict mode)           |
| Hosting + DB   | Scalingo (osc-fr1)                 |
| Database       | PostgreSQL                         |
| Cache          | Redis                              |
| Email          | Lettermint (NL, vanaf fase 6)      |
| Object storage | S3-compatible (vanaf fase 6)       |
| Analytics      | Plausible (cookieless, EU)         |
| Monitoring     | Scalingo built-in (logs + alerts)  |
| Payments       | Mollie (vanaf fase 8)              |

## Lokale ontwikkeling

```bash
# 1. Installeer deps
npm install

# 2. Kopieer env-template
cp .env.example .env.local

# 3. Vul minimaal NODE_ENV en eventueel DATABASE_URL/REDIS_URL in
#    Voor fase 1 zijn DB/Redis NIET nodig — zie .env.example.

# 4. Start dev server
npm run dev
# → http://localhost:3000
```

### Beschikbare scripts

| Script                 | Wat                                     |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start Next.js dev server                |
| `npm run build`        | Productie build                         |
| `npm run start`        | Start productie server (node server.js) |
| `npm run lint`         | ESLint check                            |
| `npm run type-check`   | `tsc --noEmit`                          |
| `npm run format`       | Prettier write                          |
| `npm run format:check` | Prettier check (CI)                     |

### Pre-commit hook

Husky draait `lint-staged` (Prettier + ESLint --fix) en `type-check` voor elke
commit. Bij een type-error of lint-error wordt de commit geweigerd. Repareer
het probleem of forceer de commit met `--no-verify` alleen wanneer absoluut
nodig (en vermeld het in de PR).

## Environment variables

Zie [`.env.example`](./.env.example) voor de volledige lijst. Variabelen worden
type-safe gevalideerd in [`lib/env.ts`](./lib/env.ts) via Zod. De app faalt
hard in productie bij missende kritieke vars; in dev/test logt-ie alleen een
waarschuwing.

Per fase wordt de validatie strikter:

- **fase 1**: `NODE_ENV` (default 'development')
- **fase 2**: `DATABASE_URL`, `REDIS_URL`, `ENCRYPTION_KEY` verplicht
- **fase 6**: `NEXTAUTH_SECRET`, `LETTERMINT_API_KEY`, `FROM_EMAIL` verplicht
- **fase 8**: `MOLLIE_API_KEY`, `MOLLIE_WEBHOOK_SECRET` verplicht

## Deploy-flow

GitHub `main` branch is gekoppeld aan Scalingo via auto-deploy:

1. Push naar `main`
2. Scalingo triggert build (Node buildpack)
3. `npm install` → `npm run build`
4. Release-fase: `./scripts/release.sh` (draait `prisma migrate deploy` zodra
   `prisma/schema.prisma` bestaat — vanaf fase 2)
5. Web-proces: `node server.js`

Setup-instructies voor Scalingo, custom domain, en GitHub-integratie staan in
[`docs/setup.md`](./docs/setup.md).

## Project structuur

```
.
├── app/               Next.js App Router (publieke + dashboard + admin)
├── components/        ui / features / layout
├── lib/               db, env, queries (helpers)
├── prisma/            schema + migrations (vanaf fase 2)
├── scripts/           release & maintenance scripts
├── public/            statische assets (fonts, images)
├── styles/            design tokens (CSS variables)
├── docs/              setup, fase-completions, compliance
└── tests/             tests (vanaf fase 2)
```

## Documentatie

- [`docs/setup.md`](./docs/setup.md) — Scalingo + GitHub setup-stappen
- [`docs/phase-1-completion.md`](./docs/phase-1-completion.md) — fase 1 status

## Brand & design

Editorial krant-stijl (denk Consumentenbond + NRC Service):

- **Fonts**: Source Serif 4 (koppen) + Inter (UI), zelf gehost via `next/font`
- **Kleuren**: cream paper `#F7F3EC` + ink `#1A1A1A` + accent-rood `#B91C1C`
- **Geen** emoji, gradients, rounded corners (radius 2px max), schaduwen
  (behalve `4px 4px 0 ink` paper-stamp)
- **Em-dash rules** (`────`) als prefix op section-labels
- **Romeinse cijfers** voor delen (`Deel I · Vakgebieden`)
- **Eén italic woord per H1** (signature move)

Volledige tokens in [`styles/design-tokens.css`](./styles/design-tokens.css).

## Status

**Fase 1** — Project Setup & Infrastructure ✓

Volgende: fase 2 (Database Schema & Data Import).
