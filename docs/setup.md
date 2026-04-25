# Setup — Klushulpgids.nl

Eenmalige setup-instructies voor productie-omgeving (Scalingo + GitHub +
custom domain). Voor lokaal ontwikkelen zie de [README](../README.md).

## 1. Scalingo CLI installeren

```bash
curl -O https://cli-dl.scalingo.com/install && bash install
scalingo login
```

## 2. App aanmaken (regio `osc-fr1` — FR EU-sovereign)

```bash
scalingo create klushulpgids --region osc-fr1
```

> **Naam in gebruik?** Voeg een suffix toe (bijv. `klushulpgids-prod`) en pas
> de domain-stappen hieronder aan.

## 3. Addons toevoegen

```bash
scalingo --app klushulpgids addons-add postgresql postgresql-starter-512
scalingo --app klushulpgids addons-add redis      redis-starter-256
```

`DATABASE_URL` en `REDIS_URL` worden automatisch geïnjecteerd.

## 4. Environment variables zetten

```bash
# Genereer secrets
scalingo --app klushulpgids env-set \
  NEXTAUTH_SECRET="$(openssl rand -hex 32)" \
  ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  REVALIDATE_SECRET="$(openssl rand -hex 32)"

# Public domain config
scalingo --app klushulpgids env-set \
  NEXTAUTH_URL=https://klushulpgids.nl \
  FROM_EMAIL=noreply@klushulpgids.nl \
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN=klushulpgids.nl

# Feature flags — alles uit bij launch
scalingo --app klushulpgids env-set \
  NEXT_PUBLIC_FEATURE_PREMIUM_LISTINGS=false \
  NEXT_PUBLIC_FEATURE_SPONSORED=false \
  NEXT_PUBLIC_FEATURE_DISPLAY_ADS=false \
  NEXT_PUBLIC_FEATURE_PAYMENTS=false \
  NEXT_PUBLIC_FEATURE_COMPARE=false \
  NEXT_PUBLIC_FEATURE_ADV_ANALYTICS=false
```

API-keys (`LETTERMINT_API_KEY`, `MOLLIE_API_KEY`, `STORAGE_*`) worden in latere
fases via `env-set` toegevoegd.

## 5. GitHub-integratie

Via Scalingo dashboard: **Settings → Git**:

1. Link GitHub repo `klushulpgids`
2. Auto-deploy branch: `main`
3. Deploy on push: aan
4. Wait for CI: aan (alleen deployen als GitHub Actions groen is)

## 6. Custom domain + SSL

```bash
scalingo --app klushulpgids domains-add klushulpgids.nl
scalingo --app klushulpgids domains-add www.klushulpgids.nl
```

Daarna in DNS (bij domeinregistrar):

- `A`-record (apex): IP zoals getoond door `domains-list`
- `CNAME` (`www`): de Scalingo-domein zoals getoond
- Alternatief: `ALIAS`/`ANAME`/`CNAME-flattening` op apex (bij Cloudflare,
  Hetzner DNS Console, etc.)

SSL wordt automatisch aangevraagd via Let's Encrypt zodra DNS propagated is.

## 7. Eerste deploy

Push naar `main` triggert auto-deploy:

```bash
git push origin main
scalingo --app klushulpgids logs --follow
```

Bij succes:

```
▶ Klushulpgids ready on http://0.0.0.0:<PORT>
```

## 8. Verificatie

- [ ] `https://klushulpgids.nl` laadt en toont hero-pagina
- [ ] DevTools console: geen errors
- [ ] Lighthouse mobiel: Perf >85, A11y >90, Best Practices >90, SEO >90
- [ ] Security headers via [securityheaders.com](https://securityheaders.com/?q=klushulpgids.nl): A+
- [ ] `scalingo --app klushulpgids logs`: geen errors

## 9. Trouble­shooting

### Build faalt op Scalingo

- Check Node-versie in `package.json` `engines.node` (>=20)
- Check of `npm ci` lokaal werkt met dezelfde `package-lock.json`
- Logs: `scalingo --app klushulpgids logs`

### `prisma migrate deploy` faalt in release-fase

In fase 1 is er nog geen Prisma schema; `scripts/release.sh` skipt migraties
als `prisma/schema.prisma` ontbreekt. Vanaf fase 2: zorg dat de schema-file
gecommit is en de DB-URL klopt.

### Custom domain SSL pending

Let's Encrypt heeft tot 5 minuten nodig na DNS-propagatie. Check status met
`scalingo --app klushulpgids domains-list`.
