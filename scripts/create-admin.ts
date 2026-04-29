/**
 * Maak (of promoot) een gebruiker tot ADMIN.
 *
 * Lokaal:
 *   npx tsx scripts/create-admin.ts founder@klushulpgids.nl
 *
 * Productie (Scalingo):
 *   scalingo --app klushulpgids run --detached -- \
 *     npx tsx scripts/create-admin.ts founder@klushulpgids.nl
 *
 * Idempotent: bestaat de user al, dan wordt diens rol op ADMIN gezet.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    console.error('Gebruik: npx tsx scripts/create-admin.ts <e-mail>')
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    if (existing.role === 'ADMIN') {
      console.log(`✓ ${email} is al ADMIN (id: ${existing.id})`)
      return
    }
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
      select: { id: true, role: true },
    })
    console.log(`↻ ${email} gepromoot ${existing.role} → ${updated.role} (id: ${updated.id})`)
    await prisma.complianceLog.create({
      data: {
        eventType: 'ADMIN_ROLE_GRANTED',
        metadata: {
          userId: updated.id,
          email,
          fromRole: existing.role,
          toRole: 'ADMIN',
          via: 'create-admin.ts',
          at: new Date().toISOString(),
        },
      },
    })
    return
  }

  const created = await prisma.user.create({
    data: { email, role: 'ADMIN' },
    select: { id: true },
  })
  console.log(`✓ ADMIN aangemaakt: ${email} (id: ${created.id})`)
  console.log('\n→ Log nu in via /inloggen met dit e-mailadres om uw sessie te starten.')
  await prisma.complianceLog.create({
    data: {
      eventType: 'ADMIN_USER_CREATED',
      metadata: {
        userId: created.id,
        email,
        via: 'create-admin.ts',
        at: new Date().toISOString(),
      },
    },
  })
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
