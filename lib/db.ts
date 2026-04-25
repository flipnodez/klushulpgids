/**
 * Database client placeholder.
 *
 * In fase 2 wordt dit een Prisma client met singleton-pattern voor dev:
 *   import { PrismaClient } from '@prisma/client'
 *   export const db = globalThis.__db ?? new PrismaClient(...)
 *
 * In fase 1 leveren we alleen het bestandsskelet zodat imports stabiel zijn.
 */
export const db = null as unknown
