# Lokale database setup

Voor lokale development heb je een PostgreSQL 16 nodig. Productie draait op
Scalingo's addon (`postgresql:postgresql-starter-512`); deze docs beschrijven
twee opties voor lokaal werken.

## Optie A — Postgres.app (aanbevolen, geen CLI nodig)

De simpelste setup als je geen Docker wilt of geen ervaring hebt:

1. Download [Postgres.app](https://postgresapp.com/downloads.html)
2. Sleep naar `Applications/`
3. Open de app — klik **Initialize** (of "Start" als hij al een server toont)
4. Postgres draait nu op `localhost:5432` met user `${USER}` (jouw macOS username)

**Connection string voor `.env.local`:**

```bash
# Vervang $USER door je macOS username (bijv. "filip")
DATABASE_URL="postgresql://$USER@localhost:5432/klushulpgids?schema=public"
```

Maak de database aan (eenmalig):

```bash
# Postgres.app voegt psql toe aan PATH na install
psql -U $USER -d postgres -c "CREATE DATABASE klushulpgids;"
```

> Werkt `psql` niet? Voeg in je `~/.zshrc` toe:
> `export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"`
> Daarna `source ~/.zshrc`.

## Optie B — Docker Compose

Als je Docker Desktop gebruikt:

```bash
docker compose up -d         # Start postgres + redis
docker compose ps            # Check status
docker compose logs postgres # Logs
docker compose down          # Stop (data behouden)
docker compose down -v       # ⚠ Stop + data wissen
```

**Connection string voor `.env.local`:**

```bash
DATABASE_URL="postgresql://klushulpgids:klushulpgids_dev@localhost:5432/klushulpgids?schema=public"
REDIS_URL="redis://localhost:6379"
```

(Credentials staan in `docker-compose.yml` — alleen voor lokale dev, niet
productie.)

## Verificatie

Na setup:

```bash
# Test connectie via Prisma
npx prisma db push --skip-generate

# Of via psql (Postgres.app)
psql -U $USER -d klushulpgids -c "SELECT version();"
```

## Migrations workflow

Lokale dev:

```bash
npx prisma migrate dev --name <descriptive_name>
```

Genereert SQL migration files in `prisma/migrations/` (gecommit naar git).

Productie (automatisch op Scalingo):

```bash
# Triggered by `scripts/release.sh` op elke deploy
npx prisma migrate deploy
```

## Trouble­shooting

### `prisma migrate dev` crasht met "drift detected"

Lokale schema en migrations zijn uit sync. Reset:

```bash
npx prisma migrate reset
npx prisma migrate dev
```

Verwijdert alleen lokale data — productie ongemoeid.

### Connectie geweigerd op `:5432`

- Postgres.app: check of de app draait (groen vinkje in menu bar)
- Docker: `docker compose ps` — moet `healthy` tonen voor postgres

### Verkeerde versie

Schema is getest op Postgres 16. Lagere versies (13-) ondersteunen niet alle
features (bijv. multirange types). Postgres.app installeert standaard de
laatste versie.
