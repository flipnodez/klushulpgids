import 'server-only'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Schrijf een ComplianceLog-entry voor een admin-actie.
 *
 * Gebruik: na elke wijziging die een admin doet, log het zodat we later
 * een audit-trail hebben (wie deed wat wanneer). Verwerkt automatisch
 * de actuele session zodat het call-site simpel blijft:
 *
 *   await logAdminAction('PROFILE_EDIT', { tradespersonId, fieldsChanged })
 *
 * Zonder admin-session is dit een no-op (functie wordt verondersteld
 * alleen vanuit admin-context aangeroepen te worden, maar we crashen niet
 * als dat eens fout gaat).
 */
export async function logAdminAction(
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const session = await auth()
  const adminId = session?.user?.id ?? null
  const role = session?.user?.role ?? null

  await prisma.complianceLog.create({
    data: {
      eventType: `ADMIN_${action}`,
      metadata: {
        ...metadata,
        adminId,
        adminRole: role,
        at: new Date().toISOString(),
      },
    },
  })
}

/**
 * Wrapper die de huidige session valideert + role-check doet, en de userId
 * + role teruggeeft als de check slaagt. Throw bij ongeautoriseerd gebruik.
 *
 * `editor` toelaten via `roles: ['ADMIN', 'EDITOR']`. ADMIN-only via
 * `roles: ['ADMIN']`.
 */
export async function requireAdminRole(
  roles: Array<'ADMIN' | 'EDITOR'> = ['ADMIN', 'EDITOR'],
): Promise<{ userId: string; role: 'ADMIN' | 'EDITOR' }> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Niet ingelogd')
  }
  const role = session.user.role
  if (role !== 'ADMIN' && role !== 'EDITOR') {
    throw new Error('Onvoldoende rechten')
  }
  if (!roles.includes(role)) {
    throw new Error('Onvoldoende rechten voor deze actie')
  }
  return { userId: session.user.id, role }
}
