import { resolveCityFromInput, resolveTradeFromInput } from '@/lib/queries'

/**
 * Search-resolver via Route Handler. Voert slug-matching uit en stuurt een
 * echte HTTP 302 redirect — geen meta-refresh fallback (zoals bij server
 * component `redirect()` in een page met streaming Suspense).
 *
 * Belangrijk: we sturen **relatieve paden** in de Location-header, geen
 * absolute URLs. Achter de Scalingo reverse-proxy is `request.url` de
 * interne container-URL (https://0.0.0.0:PORT/), niet het publieke domein.
 * Relatieve Location-headers worden door alle moderne browsers correct
 * geresolved tegen de oorspronkelijke origin (RFC 7231).
 *
 * Flow:
 *   1. SearchInput form submit → /api/search?vak=...&plaats=...
 *   2. Resolver bekijkt input
 *   3. Match: 302 → /[vak]/[stad] of /[vak] of /plaats/[stad]
 *   4. Geen match: 302 → /zoeken?... (fuzzy results-pagina)
 */
function redirectTo(path: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: path },
  })
}

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
      return redirectTo(`/${trade.slug}/${city.slug}`)
    }
    if (trade && !city) {
      return redirectTo(`/${trade.slug}`)
    }
    if (!trade && city) {
      return redirectTo(`/plaats/${city.slug}`)
    }
  }

  // Alleen vak
  if (vak && !plaats) {
    const trade = await resolveTradeFromInput(vak)
    if (trade) {
      return redirectTo(`/${trade.slug}`)
    }
  }

  // Alleen plaats
  if (plaats && !vak) {
    const city = await resolveCityFromInput(plaats)
    if (city) {
      return redirectTo(`/plaats/${city.slug}`)
    }
  }

  // Geen exacte match → /zoeken voor fuzzy results
  const fallbackParams = new URLSearchParams()
  if (vak) fallbackParams.set('vak', vak)
  if (plaats) fallbackParams.set('plaats', plaats)
  if (q) fallbackParams.set('q', q)
  const queryString = fallbackParams.toString()
  return redirectTo(queryString ? `/zoeken?${queryString}` : '/zoeken')
}
