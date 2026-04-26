import { NextResponse } from 'next/server'

import { resolveCityFromInput, resolveTradeFromInput } from '@/lib/queries'

/**
 * Search-resolver via Route Handler. Voert dezelfde slug-matching uit als
 * /zoeken, maar als API-route (geen page) zodat we een echte HTTP 302/307
 * redirect kunnen sturen — geen meta-refresh fallback door streaming.
 *
 * Het probleem dat dit oplost: server-component `redirect()` in een page met
 * Suspense (loading.tsx) faalt over naar een meta-refresh, met een flash van
 * "loading…" voor de gebruiker. Een route handler streamt geen HTML, dus de
 * redirect is een echte HTTP-response.
 *
 * Flow:
 *   1. SearchInput form submit → /api/search?vak=...&plaats=...
 *   2. Resolver bekijkt input
 *   3. Match: 302 → /[vak]/[stad] of /[vak] of /plaats/[stad]
 *   4. Geen match: 302 → /zoeken?... (volledige zoek-pagina toont fuzzy results)
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const vak = url.searchParams.get('vak')?.trim()
  const plaats = url.searchParams.get('plaats')?.trim()
  const q = url.searchParams.get('q')?.trim()

  // Beide vak + plaats: probeer exacte match
  if (vak && plaats) {
    const [trade, city] = await Promise.all([
      resolveTradeFromInput(vak),
      resolveCityFromInput(plaats),
    ])
    if (trade && city) {
      return NextResponse.redirect(new URL(`/${trade.slug}/${city.slug}`, request.url), 302)
    }
    if (trade && !city) {
      return NextResponse.redirect(new URL(`/${trade.slug}`, request.url), 302)
    }
    if (!trade && city) {
      return NextResponse.redirect(new URL(`/plaats/${city.slug}`, request.url), 302)
    }
  }

  // Alleen vak
  if (vak && !plaats) {
    const trade = await resolveTradeFromInput(vak)
    if (trade) {
      return NextResponse.redirect(new URL(`/${trade.slug}`, request.url), 302)
    }
  }

  // Alleen plaats
  if (plaats && !vak) {
    const city = await resolveCityFromInput(plaats)
    if (city) {
      return NextResponse.redirect(new URL(`/plaats/${city.slug}`, request.url), 302)
    }
  }

  // Geen exacte match → naar /zoeken voor fuzzy resultaten
  const fallback = new URL('/zoeken', request.url)
  if (vak) fallback.searchParams.set('vak', vak)
  if (plaats) fallback.searchParams.set('plaats', plaats)
  if (q) fallback.searchParams.set('q', q)
  return NextResponse.redirect(fallback, 302)
}
