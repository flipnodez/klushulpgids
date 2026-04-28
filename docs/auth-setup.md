# Auth & Storage Setup — Handmatige stappen

Phase 6 voegt magic-link auth + vakman-dashboard toe. De code is volledig
geleverd; deze doc beschrijft de externe services die buiten de codebase
geconfigureerd moeten zijn.

## 1. Lettermint (transactional email)

### DNS-records

Voeg bij de DNS-host van `klushulpgids.nl` de records toe die Lettermint
opgeeft (typisch DKIM, SPF, DMARC):

| Type | Name                            | Value (voorbeeld)                        |
| ---- | ------------------------------- | ---------------------------------------- |
| TXT  | `klushulpgids.nl`               | `v=spf1 include:_spf.lettermint.co ~all` |
| TXT  | `lm._domainkey.klushulpgids.nl` | `v=DKIM1; k=rsa; p=...`                  |
| TXT  | `_dmarc.klushulpgids.nl`        | `v=DMARC1; p=quarantine; rua=mailto:...` |

Wacht tot Lettermint dashboard zegt "Domain verified" (kan tot 24 uur duren).

### Env-var

```bash
scalingo --app klushulpgids env-set LETTERMINT_API_KEY=<key>
```

### Test e-mail-flow

```bash
# Lokaal — sturen via stub (logt naar console, geen echte mail)
unset LETTERMINT_API_KEY
npm run dev
# /inloggen → vul je eigen email in → check console voor logregel

# Productie — echte verzending
# /inloggen → magic-link arriveert binnen 30s in inbox
```

## 2. Scaleway Object Storage

### Bucket

| Property        | Value                                             |
| --------------- | ------------------------------------------------- |
| Bucket name     | `klushulpgids-photos`                             |
| Region          | `nl-ams`                                          |
| Public endpoint | `https://klushulpgids-photos.s3.nl-ams.scw.cloud` |
| API endpoint    | `https://s3.nl-ams.scw.cloud`                     |

### Policy & ACL — per-object aanpak

We gebruiken **geen bucket-policy**. In plaats daarvan zet de upload-code
(`lib/storage/objects.ts`) per object `ACL: 'public-read'`. Voordeel:

- Geen handmatige bucket-config nodig
- Foto-bytes gaan via onze server, zodat we kunnen valideren (type, size, magic bytes)
- Toekomstig: privé objecten zijn triviaal — laat ACL gewoon weg

### Env-vars

Alle vijf moeten gezet zijn:

```bash
scalingo --app klushulpgids env-set \
  STORAGE_ENDPOINT=https://s3.nl-ams.scw.cloud \
  STORAGE_REGION=nl-ams \
  STORAGE_BUCKET_NAME=klushulpgids-photos \
  STORAGE_ACCESS_KEY=<SCW...> \
  STORAGE_SECRET_KEY=<secret>
```

### ⚠ Key rotation — vóór 2027-04-15

De huidige Scaleway access key heeft **één jaar** geldigheidsduur. Zet
**nu** een calendar reminder voor uiterlijk **2027-04-15** om de key te
roteren:

1. Log in op <https://console.scaleway.com/iam/api-keys>
2. Genereer nieuwe API key (zelfde steps als bij setup)
3. Update Scalingo env-vars `STORAGE_ACCESS_KEY` + `STORAGE_SECRET_KEY`
4. Herdeploy
5. Verifieer dat foto-upload nog werkt
6. **Daarna** — niet eerder — de oude key intrekken

Bij het overschrijven van de oude key in Scalingo voordat je de nieuwe hebt
getest gaat foto-upload tijdelijk down voor live gebruikers.

## 3. NextAuth

`NEXTAUTH_SECRET` (32+ chars) en `NEXTAUTH_URL` zijn al gezet sinds Phase 1.
Verifieer:

```bash
scalingo --app klushulpgids env | grep -E 'NEXTAUTH'
```

Bij domeinwijziging: `NEXTAUTH_URL` moet de **canonieke** URL zijn (geen
trailing slash, geen `www` als dat niet de canonical is). Mismatch → magic
links falen met "Verification" error.

## 4. Redis (rate-limiting)

`REDIS_URL` is gezet. Rate-limit valt fail-open zonder Redis (niet ideaal
voor login). Verifieer wekelijks dat Redis bereikbaar is:

```bash
scalingo --app klushulpgids run --silent -- node -e \
  "const r = new (require('ioredis'))(process.env.REDIS_URL); r.ping().then(p => { console.log(p); process.exit(0) })"
# verwacht: PONG
```

## 5. Eerste-week monitoring

Dag 1 na deploy:

- [ ] Magic-link login eind-tot-eind getest met echt e-mailadres
- [ ] Foto-upload getest (1 JPG van ~1 MB)
- [ ] Profiel-bewerking opgeslagen + zichtbaar op publieke profiel-pagina
- [ ] Beschikbaarheid setting opgeslagen + zichtbaar
- [ ] Calendar reminder voor key-rotation aangemaakt

Week 1:

- [ ] Compliance-log entries verschijnen (USER_SIGNIN, PROFILE_CLAIMED, …)
- [ ] Geen "Verification" errors in Scalingo logs
- [ ] Lettermint dashboard toont delivered-rate ≥ 98%

## 6. Test-procedure

### Magic-link rate-limiting

```bash
# Probeer 4× achter elkaar in te loggen met hetzelfde e-mailadres.
# Verwacht: 4e poging krijgt "U heeft het maximum aantal inlog-links bereikt"
```

### Claim-flow

1. Bezoek <https://klushulpgids.nl/voor-vakmensen/claim>
2. Vul KvK-nummer van een geldig profiel in
3. Mailbox van het bekende email-adres ontvangt magic link
4. Klik → land op `/dashboard/welkom?claim=<id>`
5. `tradesperson.profileClaimed` is nu `true`, `User.tradespersonId` is
   gekoppeld

### GDPR delete

1. Login op een test-profiel
2. /dashboard/instellingen → "Verwijder mijn profiel"
3. Type "VERWIJDER" → bevestig
4. Profiel + reviews + foto's weg uit DB
5. KvK + emailHash in `OptOutBlacklist`
6. Foto-objecten weg uit Scaleway (check console)
7. Bevestigingsmail ontvangen
8. Re-claim met zelfde KvK → blacklist-block (toekomstige fase 7 admin queue)

## 7. Bekende limieten in Phase 6

- Geen rich-text-editor (Tiptap) — beschrijving is plain textarea
- Geen drag-and-drop reorder voor foto's — alleen displayOrder via createdAt
- Foto's gaan server-side door onze dyno (max ~5 MB per upload, prima voor
  profielfoto's). Direct browser-to-S3 upload via presigned URLs vergt CORS
  en die config is nu bewust niet gedaan. Eventueel later toe te voegen.
- E-mail wijziging zonder verificatiestap — voor MVP direct opgeslagen
