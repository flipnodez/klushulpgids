# Fase 1 — Completion Report

**Status:** ✅ Lokaal werkend en klaar voor deploy
**Datum:** 2026-04-25

## Wat is gebouwd

### Repo & toolchain

- Next.js **15.5.15** (App Router) + React 19 + TypeScript 5.7 strict
- ESLint 9 (flat config in `eslint.config.mjs`) + Prettier 3 + Husky 9
- `lint-staged` op staged files; pre-commit hook draait Prettier + ESLint --fix + `tsc --noEmit`
- `.editorconfig`, uitgebreide `.gitignore`, `.prettierignore`, `.slugignore`
- Lokale git repo geïnitialiseerd op branch `main`

### Mappenstructuur

```
app/
  (public)/  (dashboard)/  (admin)/  api/
  layout.tsx  page.tsx  page.module.css  globals.css
components/
  ui/  features/  layout/
lib/
  db.ts  env.ts  queries/
prisma/                     ← leeg, gevuld in fase 2
scripts/
  release.sh                ← Scalingo release-fase
public/
  fonts/  images/
styles/
  design-tokens.css         ← gekopieerd van Design concept/colors_and_type.css
docs/
  setup.md  phase-1-completion.md  compliance/
tests/                      ← gevuld vanaf fase 2
.github/workflows/
  ci.yml
```

### Scalingo + deploy

- `Procfile`: `web: node server.js` + `release: ./scripts/release.sh`
- `scalingo.json`: PostgreSQL + Redis addons, `osc-fr1` regio, feature flags op `false`, secret-generators voor NEXTAUTH_SECRET / ENCRYPTION_KEY / REVALIDATE_SECRET
- `server.js`: custom Next.js server met graceful SIGTERM/SIGINT handling
- `scripts/release.sh`: skipt `prisma migrate deploy` als `prisma/schema.prisma` ontbreekt (voor fase 1) — vanaf fase 2 draait migrate deploy hard
- `.slugignore`: sluit `data-pipeline/`, `Design concept/` en de Python-scraping files uit van Scalingo slug

### Environment & validatie

- `.env.example` met alle variabelen voor fases 1–8
- `lib/env.ts` met Zod-schema; faalt hard in productie bij ontbrekende kritieke vars, waarschuwt in dev/test
- Per-fase escalatie van required-velden gedocumenteerd in README

### Layout + Hello World

- `app/layout.tsx`: `<html lang="nl">`, theme-color meta (light + dark), Source Serif 4 + Inter via `next/font` (lokaal gehost — geen Google CDN-call), skip-to-content link
- `app/page.tsx`: hero met masthead-datum (`Intl.DateTimeFormat` `nl-NL`), em-dash rule prefix, één italic woord (`.nl` in accent-rood), Deel I colophon
- `app/globals.css`: editorial helpers (`.label`, `.rule`, `.stamp`), focus ring, skip-link styling
- `styles/design-tokens.css`: volledige tokens-set (kleuren light + dark, typografie, spacing, radius, rules, container)

### CI & security

- `.github/workflows/ci.yml`: type-check → lint → format-check → build → test placeholder
- Security headers in `next.config.js`: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera/mic geblokkeerd, geo=self), HSTS 2 jaar incl. subdomains preload, X-Robots-Tag noai/noimageai
- Verificatie via lokale `curl -I`: alle headers aanwezig op productie-build

## Lokaal geverifieerd

| Check                        | Resultaat                         |
| ---------------------------- | --------------------------------- |
| `npm install`                | ✅ geen CVE-warnings              |
| `npm run type-check`         | ✅ geen errors                    |
| `npm run lint`               | ✅ geen errors                    |
| `npm run format:check`       | ✅ alle files conform Prettier    |
| `npm run build`              | ✅ 102 kB First Load JS, 4 routes |
| `node server.js` (productie) | ✅ HTTP 200, headers correct      |
| Pre-commit hook bij type err | ✅ blokkeert (`code 2`)           |
| `next/font` lokale woff2     | ✅ 3× preload in HTML head        |

## Afwijkingen van de prompt

| Onderdeel              | Wijziging                                                                           | Reden                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js versie         | `15.5.15` ipv `15.1.6`                                                              | 15.1.6 heeft gepubliceerde CVE (CVE-2025-66478) bij install — npm waarschuwt expliciet                                                         |
| ESLint config          | `eslint.config.mjs` (flat) ipv `.eslintrc.json`                                     | ESLint 9 ondersteunt `.eslintrc.*` niet meer in directe CLI-aanroepen (`eslint .`), wat lint-staged kapot maakt                                |
| `npm run lint`         | `eslint .` ipv `next lint`                                                          | `next lint` is gedeprecateerd en wordt verwijderd in Next.js 16                                                                                |
| `output: 'standalone'` | NIET gezet                                                                          | Conflicteert met custom `server.js` (standalone genereert eigen server in `.next/standalone/`); Scalingo's Node buildpack heeft het niet nodig |
| Procfile release       | `./scripts/release.sh` ipv inline `prisma migrate deploy`                           | In fase 1 bestaat `prisma/schema.prisma` nog niet; het script skipt netjes en wordt vanaf fase 2 strikt                                        |
| Werkmap                | Bestaande Python-scrapingbestanden + `Design concept/` blijven naast de Next.js app | Niet-destructief: `.gitignore` + `.slugignore` sluiten ze uit van git en deploys                                                               |

## Niet gedaan (handmatige stappen voor founder)

Deze stappen moeten éénmalig handmatig — zie [`docs/setup.md`](./setup.md):

1. GitHub repo `klushulpgids` aanmaken (private), `git remote add origin` + push
2. `scalingo create klushulpgids --region osc-fr1` + addons toevoegen
3. Secrets zetten via `scalingo env-set` (NEXTAUTH_SECRET, ENCRYPTION_KEY, REVALIDATE_SECRET)
4. GitHub-integratie koppelen via Scalingo dashboard (auto-deploy `main`)
5. Custom domain `klushulpgids.nl` + DNS-records bij registrar
6. SSL automatisch via Let's Encrypt na DNS-propagatie

Lighthouse-scores en `securityheaders.com` A+ zijn pas testbaar **na live-deploy** op de productie-URL.

## Aandachtspunten voor fase 2

- `lib/db.ts` is een placeholder — vervang door Prisma singleton zodra schema bestaat
- `lib/env.ts` Zod-schema heeft nu `DATABASE_URL`/`REDIS_URL` als optional; vanaf fase 2 verplicht maken (`.url()` zonder `.optional()`)
- `scripts/release.sh` skip-pad weghalen zodra `prisma/schema.prisma` bestaat — laat geen silent-failures toe in productie
- `tests/` map is leeg met `.gitkeep` — fase 2 voegt de eerste integration tests toe (geen mocked DB volgens design-richtlijn)
- Bestaande scraping-data (`vakbedrijven*.json`, `merge_sources.py` etc.) staan in repo-root maar worden niet gecommit/gedeployed; voor fase 2 import-pipeline kunnen deze als bron dienen, maar overweeg een `data-pipeline/` move voor schoonheid
- ESLint-warning over `next lint` deprecation is in fase 1 al opgelost door directe `eslint` CLI; geen actie nodig

## Volgende stap

Zodra fase 1 live staat op `https://klushulpgids.nl` en de validatie-checklist in [setup.md §8](./setup.md#8-verificatie) groen is — door naar **fase 2: Database Schema & Data Import**.
