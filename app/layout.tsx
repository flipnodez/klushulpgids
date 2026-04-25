import type { Metadata, Viewport } from 'next'
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

export const metadata: Metadata = {
  metadataBase: new URL('https://klushulpgids.nl'),
  title: {
    default: 'Klushulpgids.nl — In ontwikkeling',
    template: '%s · Klushulpgids.nl',
  },
  description:
    'Klushulpgids.nl — onafhankelijke gids voor Nederlandse vakmannen. Momenteel in ontwikkeling.',
  applicationName: 'Klushulpgids',
  authors: [{ name: 'Klushulpgids.nl' }],
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
        <a href="#main" className="skip-link">
          Direct naar inhoud
        </a>
        {children}
      </body>
    </html>
  )
}
