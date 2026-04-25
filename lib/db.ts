import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton.
 *
 * In dev maakt Next.js elke HMR-reload een nieuwe module-instance — zonder
 * singleton zou elke reload een nieuwe Postgres-connectie pool openen, wat
 * binnen seconden de connection limit raakt. We pinnen dus de instance op
 * globalThis voor dev/test; in productie is dat niet nodig (één boot = één
 * instance).
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
