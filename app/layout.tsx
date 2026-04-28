import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Inter, Source_Serif_4 } from 'next/font/google'

import { JsonLd } from '@/components/seo/JsonLd'
import { organizationSchema, websiteSchema } from '@/lib/schema'

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
    default: 'Klushulpgids — De onafhankelijke gids voor Nederlandse vakmensen',
    template: '%s | Klushulpgids',
  },
  description:
    'Vind een loodgieter, elektricien, schilder, dakdekker of andere vakman bij u in de buurt. KvK-geverifieerd. Geen lead-fee. Geen tussenpersoon — u neemt rechtstreeks contact op.',
  keywords: [
    'vakman',
    'loodgieter',
    'elektricien',
    'schilder',
    'aannemer',
    'klusbedrijf',
    'hovenier',
    'dakdekker',
    'KvK geverifieerd',
    'onafhankelijke gids',
  ],
  applicationName: 'Klushulpgids',
  authors: [{ name: 'Klushulpgids Redactie' }],
  creator: 'Klushulpgids',
  publisher: 'Klushulpgids',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: SITE_URL,
    siteName: 'Klushulpgids',
    title: 'Klushulpgids — De onafhankelijke gids voor Nederlandse vakmensen',
    description:
      'Vind een loodgieter, elektricien, schilder of andere vakman in uw buurt. KvK-geverifieerd. Geen lead-fee.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@klushulpgids',
    creator: '@klushulpgids',
  },
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    }),
    ...(process.env.BING_SITE_VERIFICATION && {
      other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION },
    }),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: { 'nl-NL': SITE_URL },
  },
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
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
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
