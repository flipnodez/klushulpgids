# Admin guide — Klushulpgids

Deze guide is voor founders/editors van Klushulpgids. Admin panel zit op
`/admin` (alleen toegankelijk voor users met role `ADMIN` of `EDITOR`).

## Eerste keer toegang krijgen

1. Maak een NextAuth-user aan voor je e-mailadres:
   - Ga naar `klushulpgids.nl/inloggen`, vul je email in, ontvang magic link
   - Klik link → je hebt nu een User-record met role `CONSUMER`
2. Promoot jezelf tot ADMIN via Scalingo:

   ```bash
   scalingo --app klushulpgids run --detached -- \
     npx tsx scripts/create-admin.ts <jouw-email>
   ```

3. Log opnieuw in (sessie moet ververst worden om role te zien)
4. Bezoek `/admin`

## Rollen

| Role           | Toegang                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `ADMIN`        | Alles: vakmensen, reviews, blog, **import**, **gebruikers**, **blacklist**, **compliance log** |
| `EDITOR`       | Vakmensen-bewerken (geen delete), reviews modereren, blog-CMS                                  |
| `TRADESPERSON` | Eigen profiel via `/dashboard` (geen admin-toegang)                                            |
| `CONSUMER`     | Alleen publieke pagina's                                                                       |

Self-protection: de laatste ADMIN kan zichzelf niet downgraden of verwijderen.

## Dagelijkse routine

### Reviews modereren (3-5 min/dag)

`/admin/reviews` → tab **Pending** → per review:

- Lees content. **Goedkeuren** als het een echte klantervaring lijkt
- **Afwijzen** met reden als het te dun, off-topic, of duidelijk fake is
- **Markeer als spam** als URL/promo/onzin → email-hash gaat ook naar
  blacklist zodat dezelfde spammer niet nog een review kan plaatsen

Approved reviews triggeren automatisch:

- Notification mail naar de vakman
- Aggregate rating recalc op de Tradesperson (`ratingAvg`, `ratingCount`)
- Public page revalidatie (`/vakman/<slug>`)

### Tab "Flagged"

Reviews die door een vakman zijn gemarkeerd als onterecht via zijn dashboard.
Beoordeel:

- Geldig bezwaar → **Markeer als spam** of **Afwijzen** met reden
- Niet geldig → **Flag opheffen**

### Vakmensen-bewerken

`/admin/vakmensen`:

- Filter op stad/vakgebied/claimed/tier
- Klik op naam → detail-pagina
- Bewerk alle velden + sla op (audit trail wordt vanzelf bijgewerkt)
- Acties:
  - **Force claim**: markeer profiel als geclaimd zonder magic-link (bv. na
    telefonische verificatie)
  - **Mark KvK verified**: na handmatige check op kvk.nl
  - **Resend claim-invite**: nieuwe magic-link naar bekende e-mail
  - **Verwijder** (gevarenzone, twee-staps confirm)

### Blog publiceren

`/admin/blog` → **+ Nieuwe post** OF klik bestaande post.

Editor-velden:

- **Title** + **slug** (auto via slug-generator) + **categorie**
- **Meta description** (SEO, 200 chars max)
- **Excerpt** (in lijst-views, 400 chars max)
- **Cover image** (upload via Scaleway, max 5 MB JPG/PNG/WebP) + alt-tekst
- **Body** in markdown (live preview rechts naast input)
- **Gerelateerd vakgebied + stad** voor sidebar/SEO
- **FAQ items** (repeater) — verschijnt op publieke pagina + JSON-LD FAQPage
- **HowTo stappen** (repeater) — verschijnt + JSON-LD HowTo

Save → klik **Publiceren** om live te zetten. Click **Preview ↗** om te zien
hoe de post eruit ziet zonder publish.

## Bulk-import

`/admin/import` (alleen ADMIN):

- Upload JSON-bestand (max 10 MB, max 5000 records)
- Schema staat onderaan de pagina
- Records met bestaande KvK worden **upserted** (bijgewerkt)
- Records waarvan KvK of email-hash op de blacklist staat worden **geskipt**
- Resultaat toont per skipped record de reden

Voor grote imports (> 5000 records) gebruik het CLI-script:

```bash
scalingo --app klushulpgids run --detached -- \
  npx tsx scripts/import-sample-data.ts
```

## Blacklist (GDPR)

`/admin/blacklist`:

- Bevat KvK + email-hashes van profielen die zijn verwijderd
- Wordt automatisch aangevuld bij:
  - GDPR-delete vanuit dashboard (`/dashboard/instellingen`)
  - Unsubscribe-flow (`/voor-vakmensen/uitschrijven`)
  - Admin profile-delete (vakmensen-detail)
  - Review marked as spam (alleen email-hash)
- Manueel toevoegen: vul KvK óf email + reden, klik **Toevoegen**
- Verwijderen: maakt het mogelijk dat KvK opnieuw wordt opgenomen — gebruik
  alleen na expliciet schriftelijk verzoek van de eigenaar

## Compliance log

`/admin/compliance` (alleen ADMIN):

- Read-only audit-trail van alle admin-acties + GDPR-events
- Filter op event-type, datum range, zoek-string in metadata
- **Export CSV** voor jaarlijkse compliance-rapportage

Event types die we loggen:

- `USER_SIGNIN` (NextAuth)
- `PROFILE_CLAIMED`
- `PROFILE_DELETED` (dashboard) / `PROFILE_DELETED_VIA_UNSUBSCRIBE` /
  `ADMIN_VAKMAN_DELETE`
- `CLAIM_REQUEST` / `UNSUBSCRIBE_REQUESTED`
- `REVIEW_VERIFY_REQUESTED` / `REVIEW_SUBMITTED`
- `ADMIN_*` voor elke admin-actie (edit, force-claim, approve/reject review,
  blacklist add/remove, user role change, blog publish, import run, …)

## Veiligheid

- Sessions zijn database-backed (niet JWT) → admin verwijderen verbreekt
  alle hun sessies onmiddellijk
- E-mail in DB is AES-256-GCM versleuteld; alleen admin detail-page kan
  decrypten (via `/admin/vakmensen/[id]`)
- Rate-limits: alle write-actions zijn rate-limited via Redis (zie
  `lib/rate-limit.ts`); fail-open zonder Redis (waarschuwing in dev)
- CSRF: NextAuth + Server Actions hebben automatische CSRF-bescherming
- IDOR: elke server action checkt ownership/role voordat ze uitvoert

## Troubleshooting

**Ik kan niet bij /admin** → controleer of je User-record `role: ADMIN` of
`EDITOR` heeft. Run het create-admin-script opnieuw. Refresh sessie door uit
en in te loggen.

**Email-toggle in /dashboard/instellingen werkt niet** → Lettermint moet
verified zijn (klushulpgids.nl + DKIM/SPF/DMARC). Zonder verificatie
landen mails in spam of worden geweigerd.

**Reviews worden niet zichtbaar na approval** → check dat
`revalidatePath('/vakman/<slug>')` is gelopen. Hard refresh `/vakman/<slug>`
in incognito; ISR cache kan ~1 minuut oud zijn.

**Bulk-import geeft veel skips** → bekijk de skip-redenen. Meestal is
het `city '...' onbekend` (city slug niet in DB) of `validation: KvK moet
8 cijfers zijn`. Fix de bron-data en probeer opnieuw — upserts zijn idempotent.
