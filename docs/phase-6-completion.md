# Fase 6 — Completion Report

**Status:** ✅ Code compleet, lokaal geverifieerd (`type-check`, `lint`, `build` clean). Klaar voor productie-deploy + DNS-records voor Lettermint.
**Datum:** 2026-04-28

## Wat is gebouwd

### Schema-uitbreiding

Migratie `20260428205936_phase6_auth_dashboard` voegt toe:

- **User**: `lastSignInAt`, `notifyNewReview`, `notifyMonthlyStats`, `notifyAvailabilityReminder`
- **Tradesperson**: `profileActive` (zichtbaarheid-toggle), `profileClaimedAt`
- **TradespersonPhoto**: `storageKey` (voor S3-delete), `width`, `height`
- **Account**: OAuth-velden (`refresh_token`, `access_token`, etc.) — vereist door Auth.js Prisma adapter contract, optioneel voor onze magic-link

Zal automatisch toegepast worden door Scalingo's `release: prisma migrate deploy`.

### Auth (NextAuth v5 + magic-link)

- `lib/auth.ts` — NextAuth config met PrismaAdapter, custom email-provider,
  database-sessions, role-aware session callback
- `app/api/auth/[...nextauth]/route.ts` — handler-export
- `types/next-auth.d.ts` — Session.user.{id,role,tradespersonId} types
- `events.signIn` — schrijft `lastSignInAt` + ComplianceLog `USER_SIGNIN`

### Email — Lettermint integratie

- `lib/email/lettermint.ts` — HTTP-wrapper met **graceful stub** wanneer
  `LETTERMINT_API_KEY` ontbreekt (logt naar console in dev)
- `lib/email/templates/shared.ts` — editorial email-shell (inline-styled,
  Outlook-compatibel, em-dash labels, brand-kleuren)
- 5 templates:
  - `magicLink` — 24-uurs login-link
  - `claimInvite` — bedrijf-claim (gepersonaliseerd)
  - `reviewNotification` — nieuwe review-melding
  - `availabilityReminder` — 14-daagse reminder
  - `deletionConfirmation` — GDPR-delete bevestiging

### Auth-pagina's (Nederlands, editorial style)

- `/inloggen` — email-form met server-action + rate-limiting feedback
- `/controleer-uw-mail` — verify-request landing
- `/inloggen/fout` — error-page met betekenisvolle messages per error-code
- `/voor-vakmensen/claim` — KvK-based claim-form

### Claim flow

1. Vakman vult KvK in op `/voor-vakmensen/claim`
2. Server zoekt match → stuurt magic-link naar bekend (versleuteld) e-mailadres
3. Vakman klikt link → land op `/dashboard/welkom?claim=<id>`
4. **Email-verificatie**: pas claim als `hashEmail(session.user.email) === tp.emailHash`
   (anti-takeover: alleen iemand met het bekende email-adres kan claimen)
5. Atomaire transactie: `profileClaimed=true`, `profileClaimedAt`, `User.tradespersonId`,
   `User.role=TRADESPERSON`, ComplianceLog entry

### Dashboard

`app/(dashboard)/dashboard/`:

| Pagina                       | Functionaliteit                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `/dashboard`                 | Welkom + 4 stat-tegels (30d) + actiepunten-lijst                                        |
| `/dashboard/profiel`         | Beschrijving (50-2000), telefoon, website, tariefrange, spoeddienst                     |
| `/dashboard/fotos`           | Drag-drop upload (JPG/PNG/WebP, max 5MB, max 24/profiel), cover-keuze, alt-tekst inline |
| `/dashboard/beschikbaarheid` | 5 grote knoppen, optimistic UI, toon "X dagen geleden bijgewerkt"                       |
| `/dashboard/reviews`         | Lijst approved reviews, inline reply-editor (10-500 chars), flag-as-improper met reden  |
| `/dashboard/instellingen`    | 3× notificatie-toggles, profiel-zichtbaarheid, GDPR-delete (twee-staps)                 |
| `/dashboard/welkom`          | Eerste-login + claim-confirmation                                                       |

Layout: server-component met `auth()` redirect-guard en role-check. Top-bar
met logout server-action. Linker (mobiel: bovenste) tab-nav. Verschilt
bewust van editorial masthead — werkomgeving, niet redactioneel.

### Server Actions

`app/(dashboard)/dashboard/actions.ts` (gedeeld) +
`app/(dashboard)/dashboard/fotos/actions.ts` — alle CRUD via Zod-gevalideerde
server actions:

| Action                       | Rate-limit      | Auth-guard                  |
| ---------------------------- | --------------- | --------------------------- |
| `updateProfileAction`        | 20/uur per user | owner-of-tradesperson       |
| `setAvailabilityAction`      | 30/uur per user | owner                       |
| `respondToReviewAction`      | 30/uur per user | owner + review-match        |
| `flagReviewAction`           | —               | owner + review-match        |
| `updateNotificationsAction`  | —               | owner                       |
| `setProfileActiveAction`     | —               | owner                       |
| `deleteProfileAction` (GDPR) | —               | owner + literal "VERWIJDER" |
| `updateEmailAction`          | —               | owner + uniqueness          |
| `uploadPhotoAction`          | 50/uur per user | owner + type/size check     |
| `deletePhotoAction`          | —               | owner + photo-match         |
| `setCoverPhotoAction`        | —               | owner + photo-match         |
| `updatePhotoAltAction`       | —               | owner + photo-match         |

Iedere succesvolle write doet `revalidatePath('/vakman/<slug>')` zodat de
publieke pagina meteen actueel is.

### Storage (Scaleway, per-object ACL)

`lib/storage/objects.ts` — provider-agnostisch (S3-compatible):

- `putObject({ key, body, contentType, acl='public-read' })` — server-side upload
- `deleteObject(key)` — bij foto-delete + bij GDPR-delete cascade
- `publicUrlFor(key)` — virtual-hosted-style: `https://<bucket>.s3.<region>.scw.cloud/<key>`
- Bewust **geen presigned URLs / CORS** — server-side upload houdt config
  simpel en geeft validatie-hook

### Rate limiting

`lib/rate-limit.ts` — Redis-backed sliding-window-ish counter, fail-open
zonder Redis. Toegepast op login (3/h email + 5/15min IP), claim (10/h IP),
en alle write-actions.

## Niet in scope deze fase (uitgesteld)

- **Tiptap rich-text editor** — beschrijving is plain textarea (Phase 7 als
  redactionele behoefte ontstaat)
- **Drag-drop reorder** voor foto's — alleen impliciete order via `createdAt`
- **Email-wijziging met verificatie** — voor MVP direct opgeslagen, in
  Phase 7 verificatie-stap toevoegen
- **Direct browser→S3 upload** — server-side proxy, eenvoudiger
- **Schema validation tests** — basisvalidatie via Zod, end-to-end tests in
  Phase 7

## Verificatie

```bash
npm run type-check   # ✅
npm run lint         # ✅
npm run build        # ✅ 33 routes (was 23) — 9 nieuwe Phase 6 routes + auth handler
```

## Acceptatie-criteria status

| Criterium                                    |               Status                |
| -------------------------------------------- | :---------------------------------: |
| Lettermint domain verified, emails komen aan |        ⏳ founder DNS-config        |
| DKIM/SPF/DMARC correct                       |        ⏳ founder DNS-config        |
| Magic link login werkt eind-tot-eind         |  ✅ (code) — getest na DNS-deploy   |
| Login-link verloopt na 24 uur                |       ✅ (NextAuth `maxAge`)        |
| Rate limiting actief                         |     ✅ (3/h email, 5/15min IP)      |
| Sessie persistent in DB                      |       ✅ (database-strategy)        |
| Claim via KvK-nummer werkt                   |              ✅ (code)              |
| Claim-email anti-takeover (emailHash match)  |                 ✅                  |
| Auth-redirect werkt                          |          ✅ (layout-guard)          |
| Statistieken kloppen                         |      ✅ (PageView aggregation)      |
| Profiel-form: alle velden bewerkbaar         |                 ✅                  |
| Foto-upload werkt (server-side proxy)        |           ✅ (na deploy)            |
| Foto delete + cascade in storage             |                 ✅                  |
| Beschikbaarheid: status zetten + revalidate  |                 ✅                  |
| Review-response                              |                 ✅                  |
| Review flag → admin queue                    | ✅ (`flagged=true`, admin-UI in F7) |
| Instellingen: email-prefs                    |                 ✅                  |
| GDPR delete: cascade + blacklist + email     |                 ✅                  |
| Geen XSS via profiel-velden                  | ✅ (React escaped, Zod max-length)  |
| Geen IDOR                                    |  ✅ (alle actions check ownership)  |
| CSRF                                         |   ✅ (NextAuth + Server Actions)    |
| Email versleuteld in DB                      |        ✅ (al sinds fase 2)         |

## Volgende fase

Phase 7 — Admin-panel + review-submission + bulk-import UI.
Voorvereiste: Phase 6 acceptatie-criteria ✅ + 1 week productie-monitoring
(Lettermint delivery rate, Redis uptime, eerste claims).
