#!/usr/bin/env bash
# Scalingo release-fase. In fase 1 is er nog geen Prisma schema; vanaf fase 2
# bevat prisma/schema.prisma de definities en draait `prisma migrate deploy`.
set -euo pipefail

if [ -f prisma/schema.prisma ]; then
  echo "→ Running database migrations"
  npx prisma migrate deploy
else
  echo "→ Skipping migrations (no prisma/schema.prisma yet — fase 1)"
fi

# Note: `prisma generate` draait automatisch via package.json postinstall hook.
# De seed (trades + cities) wordt eenmalig handmatig getriggerd via:
#   scalingo --app klushulpgids run "npx tsx prisma/seed.ts"
# en niet hier, omdat het anders bij elke deploy opnieuw zou draaien.
