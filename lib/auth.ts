import NextAuth, { type NextAuthConfig } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'

import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email/lettermint'
import { magicLinkTemplate } from '@/lib/email/templates/magicLink'

/**
 * NextAuth v5 — magic-link only (geen wachtwoorden, geen OAuth in fase 6).
 *
 * - Adapter: Prisma → schrijft User/Account/Session/VerificationToken in DB
 * - Provider: custom email provider via Lettermint (niet de ingebouwde
 *   nodemailer-provider — wij sturen via onze Lettermint-wrapper)
 * - Sessie: database-strategy (één sessie per ingelogd device, makkelijk
 *   te invalideren door admin)
 * - Pagina-routes: alle UI-paden zijn Nederlandstalig
 */

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: 'database' },
  pages: {
    signIn: '/inloggen',
    verifyRequest: '/controleer-uw-mail',
    error: '/inloggen/fout',
  },
  providers: [
    {
      id: 'email',
      type: 'email',
      name: 'E-mail magic link',
      maxAge: 60 * 60 * 24, // 24 uur
      // De `from` wordt via onze sendEmail-wrapper bepaald (FROM_EMAIL env / default)
      from: 'noreply@klushulpgids.nl',
      server: '', // we negeren nodemailer — `sendVerificationRequest` doet de send
      sendVerificationRequest: async ({ identifier, url }) => {
        const { html, text } = magicLinkTemplate({ url })
        const result = await sendEmail({
          to: identifier,
          subject: 'Inloggen bij Klushulpgids',
          html,
          text,
        })
        if (!result.ok) {
          throw new Error(`Magic-link mail kon niet verstuurd worden: ${result.error}`)
        }
      },
    },
  ],
  callbacks: {
    async session({ session, user }) {
      // Verrijk sessie met DB-velden die niet in de standaard User zitten
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true, tradespersonId: true },
      })
      if (session.user) {
        session.user.id = user.id
        session.user.role = dbUser?.role ?? 'CONSUMER'
        session.user.tradespersonId = dbUser?.tradespersonId ?? null
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return
      await Promise.all([
        prisma.user.update({
          where: { id: user.id },
          data: { lastSignInAt: new Date() },
        }),
        prisma.complianceLog.create({
          data: {
            eventType: 'USER_SIGNIN',
            metadata: { userId: user.id, at: new Date().toISOString() },
          },
        }),
      ])
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
