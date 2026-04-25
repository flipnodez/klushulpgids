# Design system

Editorial krant-stijl componenten voor Klushulpgids.nl. Gebaseerd op
`Design concept/` (de bron-prototype). Volg deze documenten als leidraad
boven alle andere richtlijnen:

- [`Design concept/SKILL.md`](../Design concept/SKILL.md) — hard rules
- [`Design concept/README.md`](../Design concept/README.md) — visual + content
  fundamentals

## Hard rules (NIET overtreden)

- ❌ Geen emoji
- ❌ Geen gradients
- ❌ Geen rounded corners (`--radius: 2px` is het maximum)
- ❌ Geen schaduwen — behalve `4px 4px 0 ink` op `paper-stamp` cards
- ✅ Source Serif 4 voor koppen (gewicht 500), Inter voor UI
- ✅ Labels uppercase met `letter-spacing: 0.18em`
- ✅ Altijd horizontale rules, nooit boxes
- ✅ Accent rood (`#B91C1C` light / `#EF4444` dark) — sparzaam
- ✅ Eén italic woord per H1 (signature move)
- ✅ Em-dash rule prefix op section-labels: `————  Hoofdartikel`

## Tokens

Alle CSS-vars in [`styles/design-tokens.css`](../styles/design-tokens.css)
en globally beschikbaar. Light + dark theming via `[data-theme="dark"]`.

| Categorie  | Voorbeelden                                                |
| ---------- | ---------------------------------------------------------- |
| Kleuren    | `--paper`, `--ink`, `--accent`, `--success`, `--rule-soft` |
| Typografie | `--font-serif`, `--font-sans`, `--fs-h1`, `--ls-display`   |
| Spacing    | `--sp-1` t/m `--sp-20` (4px-basis)                         |
| Radius     | `--radius` (2px max)                                       |
| Rules      | `--rule-width` (1px), `--rule-width-thick` (3px)           |
| Containers | `--container` (1240px), `--container-wide` (1440px)        |

**Gebruik**: prefereer tokens boven hardcoded waarden. Een `padding: 16px`
hoort `padding: var(--sp-4)` te zijn — dan past 'ie zich aan bij toekomstige
schaal-aanpassingen.

## Component-organisatie

```
components/
├── ui/         — Atomaire primitives (Button, Card, Stars, Icon, ...)
├── layout/     — Layout-elementen (Header, Footer, Breadcrumbs)
└── features/   — Domeinspecifieke componenten
    ├── tradesperson/   — TradespersonCard, Hero, AvailabilityBadge, ...
    ├── category/       — CategoryGrid
    ├── city/           — CityGrid
    ├── review/         — ReviewCard
    ├── search/         — SearchResults
    └── blog/           — BlogCard
```

Elk niveau exporteert via `index.ts` barrel-files:

```typescript
import { Button, Card, Logo, Stars } from '@/components/ui'
import { Header, Footer, Breadcrumbs } from '@/components/layout'
import { TradespersonCard, AvailabilityBadge } from '@/components/features/tradesperson'
```

## Component overzicht

### UI primitives — `components/ui/`

| Component     | Doel                                                         |
| ------------- | ------------------------------------------------------------ |
| `Container`   | Max-width 1240/1440px, gecentreerd, container-padding        |
| `Rule`        | Horizontale 1px / 3px / soft lijn                            |
| `Label`       | Uppercase, tracked tekst (default/muted/accent)              |
| `EmDashLabel` | Signature `————  Label tekst` met aria-hidden em-dashes      |
| `Logo`        | `Klushulpgids.nl` met rode `.` en italic `nl` (sm/md/lg)     |
| `Icon`        | Wrapper rond Lucide icons, `strokeWidth: 1.5`                |
| `Stars`       | 5 sterren rating, halve-ster support, sm/lg                  |
| `Badge`       | Klein label met optionele dot (default/accent/success/muted) |
| `Stamp`       | Rode outlined-tekst — "✓ Onafhankelijk"                      |
| `Button`      | Primary/secondary/ghost/link/accent + sm/md/lg               |
| `Card`        | 1px border container — default/soft/paper-stamp/entry        |
| `Input`       | Border-bottom only, inline label, helper/error text          |
| `SearchInput` | Twee velden (vak + plaats) gescheiden door 1px ink           |
| `DropCap`     | Eerste-letter wrapper voor editorial body-paragrafen         |

### Layout — `components/layout/`

| Component     | Doel                                                        |
| ------------- | ----------------------------------------------------------- |
| `Header`      | Masthead — datum-stempel + logo + nav, sticky               |
| `Footer`      | 4-koloms colofon — logo + tagline + 3 link-kolommen + legal |
| `Breadcrumbs` | Pad-navigatie met JSON-LD BreadcrumbList schema voor SEO    |

### Features — `components/features/`

| Categorie    | Component                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| Tradesperson | `TradespersonCard`, `TradespersonHero`, `AvailabilityBadge`, `ContactBlock`, `CertificationList`, `AssociationList` |
| Category     | `CategoryGrid` (4-koloms-raster met iconen)                                                                         |
| City         | `CityGrid` (3-5 kolommen, optioneel met provincie subtitle)                                                         |
| Review       | `ReviewCard` (met owner-response render)                                                                            |
| Search       | `SearchResults` (sort-controls + paginering)                                                                        |
| Blog         | `BlogCard` (default met cover, compact zonder)                                                                      |

## Storybook

Visuele catalogus van alle componenten:

```bash
npm run storybook       # → http://localhost:6006
npm run storybook:build # statische export voor team-review
```

Stories zijn georganiseerd per categorie (UI / Layout / Features) ipv per
component, zodat de catalogus overzichtelijk blijft. Elke story heeft een
licht/donker-toggle (toolbar rechtsboven) en a11y-paneel.

## Tests

Vitest + React Testing Library. Run met:

```bash
npm test         # eenmalig
npm run test:watch
npm run test:ui  # browser UI
```

Tests dekken kerngedrag (rating-rendering, schema.org JSON-LD, missende
velden, variant-classes). Geen 100%-coverage-doel — focus op gedrag dat
makkelijk stilletjes kapot kan zonder dat type-check het opmerkt.

## Anti-patterns (NIET doen)

| Niet                                          | Want                                                      |
| --------------------------------------------- | --------------------------------------------------------- |
| `border-radius: 8px`                          | Past niet bij krant-editorial (max 2px, meestal 0)        |
| `box-shadow: 0 2px 8px rgba(0,0,0,.1)`        | Geen schaduwen behalve paper-stamp                        |
| Emoji in labels                               | Past niet bij volwassen tone-of-voice                     |
| Gradients                                     | Pure ink-on-paper, eventueel accent — geen marketing-glow |
| Icon-pills (cirkel met gekleurde achtergrond) | Iconen zijn altijd in tekstkleur                          |
| Floating action buttons                       | Past niet bij gids-metafoor                               |
| "Gratis offerte aanvragen → "                 | Klushulpgids is een gids, geen lead-funnel                |
| `text-decoration: none` op alle links         | Editorial = onderlijning is normaal                       |

## Nieuwe componenten toevoegen

1. Plaats in juiste map: atom → `ui/`, page-level → `layout/`, domeinspecifiek → `features/<domein>/`
2. TypeScript strict, exporteer types via barrel `index.ts`
3. CSS Module per component (`Component.module.css`)
4. Story-file per component-categorie (niet per component)
5. Test alleen niet-triviaal gedrag (niet "rendert correct")
6. Volg de hard rules — wanneer in twijfel, kijk naar `Design concept/index.html`

## Bron-mapping

Wat zit er in de productie-code mapping naar het design-prototype:

| Design concept                 | Productie equivalent                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `colors_and_type.css`          | `styles/design-tokens.css`                                                    |
| `styles.css` editorial helpers | `app/globals.css` (`.label`, `.stamp`, `.tag`, `.dropcap`, `.rule`, `.serif`) |
| `components.jsx` `<Logo />`    | `components/ui/Logo.tsx`                                                      |
| `components.jsx` `<Header />`  | `components/layout/Header.tsx`                                                |
| `components.jsx` `<Footer />`  | `components/layout/Footer.tsx`                                                |
| `components.jsx` `<Stars />`   | `components/ui/Stars.tsx`                                                     |
| `components.jsx` `<Icon />`    | `components/ui/Icon.tsx` (Lucide)                                             |
| `category.jsx` listing-cards   | `components/features/tradesperson/TradespersonCard.tsx`                       |
| `home.jsx` category-grid       | `components/features/category/CategoryGrid.tsx`                               |
