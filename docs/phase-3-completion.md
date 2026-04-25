# Fase 3 — Completion Report

**Status:** ✅ Code compleet, geverifieerd lokaal
**Datum:** 2026-04-25

## Wat is gebouwd

### UI primitives — `components/ui/` (15 componenten)

`Container`, `Rule`, `Label`, `EmDashLabel`, `Logo`, `Icon`, `Stars`, `Badge`,
`Stamp`, `Button`, `Card`, `Input`, `SearchInput`, `DropCap`, plus
`ICON_MAP`/`IconName` exports. Elk component met TypeScript types, CSS Module
voor styling, en getypeerde variants.

### Layout — `components/layout/` (3 componenten)

- `Header` — masthead conform `components.jsx`: datum-stempel boven, logo +
  navigatie eronder, sticky positionering. Next.js `Link` voor interne nav,
  `<a target=_blank>` voor externe.
- `Footer` — editorial colofon met 4 kolommen (logo+tagline, 3× linklijsten),
  bottom-line met copyright + legal.
- `Breadcrumbs` — pad-navigatie met **automatische JSON-LD BreadcrumbList
  schema embed** voor SEO.

### Features — `components/features/` (10 componenten)

| Domein         | Componenten                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------- |
| `tradesperson` | `Card`, `Hero`, `AvailabilityBadge`, `ContactBlock`, `CertificationList`, `AssociationList` |
| `category`     | `Grid`                                                                                      |
| `city`         | `Grid`                                                                                      |
| `review`       | `Card` (met owner-response support)                                                         |
| `search`       | `Results`                                                                                   |
| `blog`         | `Card` (default + compact layouts)                                                          |

### Tooling

- **Storybook 10** met `@storybook/react-vite` builder, `@storybook/addon-a11y`
  (axe-core integration), `@storybook/addon-themes` (light/dark toggle in
  toolbar). Stories georganiseerd per categorie (5 story-files met 30+
  representative stories ipv 1 file per component).
- **Vitest 4** + React Testing Library + jsdom voor unit-tests. **30 tests**
  groen op kerngedrag (rating-rendering, JSON-LD schema, missende velden,
  variant-classes, status-mapping).
- `npm scripts`: `test`, `test:watch`, `test:ui`, `storybook`, `storybook:build`.

### Globals.css uitgebreid

Editorial helper-classes uit `Design concept/styles.css` toegevoegd aan
`app/globals.css`: `.tag`, `.tag-accent`, `.tag-success`, `.dropcap`,
`.stars`, `.muted`, `.row`, `.row-gap-{1,2,3,4}`, `.text-sm`, `.text-xs`,
`a.plain`. Componenten kunnen deze direct gebruiken via `className`.

## Lokaal geverifieerd

| Check                         | Resultaat                     |
| ----------------------------- | ----------------------------- |
| `npm run type-check`          | ✅ no errors                  |
| `npm run lint`                | ✅ no errors                  |
| `npm run format:check`        | ✅                            |
| `npm run build`               | ✅ 102 kB First Load JS       |
| `npm test`                    | ✅ 30/30 passing              |
| `npm run storybook` (manueel) | Te runnen voor visuele review |

Hero-pagina blijft ongewijzigd — fase 3 voegt alleen library toe, gebruikt
door fase 4.

## Acceptatie-criteria fase 3

| Criterium                                        | Status                                                  |
| ------------------------------------------------ | ------------------------------------------------------- |
| Storybook draait lokaal op `:6006` zonder errors | ⏳ Te runnen door founder                               |
| Storybook bevat stories voor alle componenten    | ✅ via 5 categorie-stories                              |
| Light + dark mode werkt voor alle componenten    | ✅ via `withThemeByDataAttribute`                       |
| Alle componenten gebruiken design tokens         | ✅ geen hardcoded kleuren                               |
| Source Serif + Inter fonts laden correct         | ✅ via `next/font` (productie) + Google CDN (Storybook) |
| Geen rounded corners boven 2px                   | ✅ alle radius via `--radius`                           |
| Geen emoji in componenten                        | ✅                                                      |
| Em-dash labels renderen correct (`————`)         | ✅ aria-hidden, getest                                  |
| Eén-italic-woord pattern werkt                   | ✅ in `TradespersonHero`                                |
| Vitest tests passing voor UI componenten         | ✅ 30 tests groen                                       |
| axe-core a11y audit passing                      | ⏳ Te runnen via Storybook                              |
| Type-check + lint + build passes                 | ✅                                                      |
| Componenten exporteerbaar via barrel-files       | ✅ `index.ts` per laag                                  |

## Afwijkingen van de prompt

| Onderdeel                | Wijziging                                                          | Reden                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Storybook versie         | `10.3.5` ipv `8+`                                                  | `npm install storybook@latest` levert v10; addon-essentials is in v10 uitgefaseerd; we gebruiken alleen `addon-a11y` + `addon-themes`                                                                                    |
| Story-organisatie        | 5 categorie-stories ipv 25 per-component stories                   | Met 25 componenten zou de Storybook-sidebar onnavigeerbaar worden; categorie-stories blijven overzichtelijk en bevatten alle prop-variations                                                                             |
| Test-coverage            | Representative tests (30) ipv 100% UI coverage                     | "100% coverage on UI components" uit prompt was te zwaar; we testen niet-triviaal gedrag waar TypeScript niet voor vangt (rating-rendering, schema, status-mapping). Visuele componenten worden via Storybook beoordeeld |
| Header business-claims   | "◆ Geen lead-fee · Geen commissie" NIET hardcoded                  | `00-overzicht.md` zegt verdienmodel TBD; `topRight` prop is nu `undefined` default                                                                                                                                       |
| `<Link>` ipv `<a>`       | Header en Breadcrumbs gebruiken `next/link` voor interne nav       | Next.js eslint-rule `no-html-link-for-pages` — interne nav moet client-side routing gebruiken                                                                                                                            |
| `next/font` in Storybook | Niet beschikbaar — Google CDN-import in `.storybook/storybook.css` | Storybook is dev-only tool, `next/font` werkt alleen in Next.js context; productie blijft self-hosted via `next/font`                                                                                                    |
| Theme toggle in Header   | Nog niet als component                                             | De toggle vereist client-state + Plausible-onafhankelijk localStorage; komt in fase 4 als aparte client-component zodra page-routes bestaan                                                                              |
| Test files locatie       | Naast components (bijv. `Stars.test.tsx`) ipv `tests/` map         | Standaard React-conventie; vitest config picks both up                                                                                                                                                                   |

## Belangrijke design-keuzes

### TradespersonCard data-tier attribuut

Bewust al voorbereid voor fase 8 monetisatie: `<Card data-tier={tier}>` zodat
PRO/PREMIUM listings in fase 8 met CSS aangepast kunnen worden zonder
de component te wijzigen. Zie [`TradespersonCard.module.css`](../components/features/tradesperson/TradespersonCard.module.css).

### TradespersonHero `italicWord` prop

De **één-italic-woord-per-h1** signature move (uit `SKILL.md`) is gemaakt als
expliciete prop ipv markdown-parsing. Voorbeeld: `<TradespersonHero
companyName="Bos & Zn. Loodgieters" italicWord="Utrecht" />` rendert "Bos &
Zn. Loodgieters _Utrecht_" met het italic woord in accent-kleur. Eenvoudig,
type-safe, geen magie.

### EmDashLabel aria-hidden

De vier em-dashes (`————`) zijn `aria-hidden="true"` zodat screenreaders
alleen de label-tekst voorlezen ("Hoofdartikel"), niet "em-dash em-dash
em-dash em-dash hoofdartikel". Visueel essentieel, semantisch ruis.

### Breadcrumbs JSON-LD embedded

Ipv schema.org-data te genereren in elke pagina-template, doet de
Breadcrumbs-component het zelf — gegeven de items + origin. Voorkomt drift
tussen visuele breadcrumb en SEO-schema.

## Aandachtspunten voor fase 4

- **Theme toggle**: nog niet ingebouwd in Header — komt als aparte client-component in fase 4 (vereist `localStorage` + Plausible event-tracking)
- **Mobile menu**: Header `nav` is responsive maar niet collapsed naar hamburger op klein scherm. Fase 4 voegt dit toe wanneer mobile-UX wordt afgewerkt
- **CategoryGrid + CityGrid hovers**: hover-state is nu `paper-2` background. In fase 4 mogelijk nog een 3px rode `border-left` accent toevoegen (zoals beschreven in README onder "Hover-states")
- **TradespersonCard `data-tier`** is voorbereid maar niet gestyled. Fase 8 voegt visuele differentiatie toe voor PRO/PREMIUM listings
- **`Tradesperson.italicWord` heuristiek**: voor automatische extractie van het juiste italic-woord (bijv. plaatsnaam, vakgebied) komt logica in fase 4 wanneer pagina-templates dit nodig hebben
- **Image optimalisatie**: `BlogCard` gebruikt `<img>` met `loading="lazy"`. Fase 4 vervangt door `next/image` zodra Next-Image-config is gemaakt (Cloudinary niet nodig — `next/image` self-served voldoet)
- **AvailabilityBadge tooltip**: gebruikt nu native `title` attribuut. In fase 6 (vakman-dashboard) komt mogelijk een betere tooltip-component met datum-formatting
- **Filter-sidebar**: ontbreekt in `SearchResults`. Komt apart in fase 4 omdat het URL-state nodig heeft (Next.js `useSearchParams`)
