/**
 * Plausible client-side event tracking.
 *
 * Het Plausible-script (geladen in app/layout.tsx) zet `window.plausible`.
 * Deze helper maakt server-rendered components veilig: alle calls worden
 * no-ops in een SSR-context.
 *
 * Server-side events (PageView opslag in DB) komen apart in fase 7 wanneer
 * we admin-analytics nodig hebben.
 */

type PlausibleEvent =
  | 'Telefoon Klik'
  | 'E-mail Klik'
  | 'Website Klik'
  | 'Profiel Bekeken'
  | 'Zoekterm'
  | 'Filter Gebruikt'
  | 'Blog Gelezen'

type PlausibleProps = Record<string, string | number | boolean>

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: PlausibleProps }) => void
  }
}

export function trackEvent(name: PlausibleEvent, props?: PlausibleProps): void {
  if (typeof window === 'undefined') return
  if (typeof window.plausible !== 'function') return
  window.plausible(name, props ? { props } : undefined)
}
