import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Inter, Source_Serif_4 } from 'next/font/google'

import './globals.css'

// Lokaal hosten via next/font (geen Google CDN-call vanaf de browser).
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
const SITE_URL = process.env.NEXTAUTH_URL ?? 'https://klushulpgids.nl'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Klushulpgids — onafhankelijke gids voor Nederlandse vakmannen',
    template: '%s · Klushulpgids',
  },
  description:
    'Onafhankelijke gids voor Nederlandse ambachtslieden. Vergelijk loodgieters, elektriciens, schilders, hoveniers en meer — met certificeringen, beoordelingen en directe contactgegevens.',
  applicationName: 'Klushulpgids',
  authors: [{ name: 'Klushulpgids.nl' }],
  // Tijdens fase 4 nog niet indexeren — pas in fase 5 zetten we robots aan
  // wanneer alle pagina's en sitemap volledig zijn.
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F3EC' },
    { media: '(prefers-color-scheme: dark)', color: '#14171B' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${sourceSerif.variable} ${inter.variable}`}>
      <body>
        {children}
        {PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
