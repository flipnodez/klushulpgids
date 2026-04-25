/**
 * Vaste mapping tussen provincie-slug en officiële naam. Hardcoded omdat NL
 * 12 provincies heeft die niet veranderen — geen DB-query nodig.
 */

export const PROVINCES = [
  'Drenthe',
  'Flevoland',
  'Friesland',
  'Gelderland',
  'Groningen',
  'Limburg',
  'Noord-Brabant',
  'Noord-Holland',
  'Overijssel',
  'Utrecht',
  'Zeeland',
  'Zuid-Holland',
] as const

export type Province = (typeof PROVINCES)[number]

export function provinceSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function provinceFromSlug(slug: string): Province | null {
  for (const p of PROVINCES) {
    if (provinceSlug(p) === slug) return p
  }
  return null
}
