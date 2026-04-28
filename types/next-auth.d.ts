import type { DefaultSession } from 'next-auth'

type AppRole = 'ADMIN' | 'EDITOR' | 'TRADESPERSON' | 'CONSUMER'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: AppRole
      tradespersonId?: string | null
    } & DefaultSession['user']
  }

  interface User {
    role?: AppRole
    tradespersonId?: string | null
  }
}
