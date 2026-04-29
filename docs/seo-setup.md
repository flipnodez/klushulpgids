# SEO Setup — Handmatige stappen

Phase 5 levert de code-kant op (metadata, schema.org, sitemap, robots,
OG-images, caching). De stappen hieronder zijn niet-code-werk dat de founder
zelf moet uitvoeren bij/na de Phase-5-deploy.

## 1. Google Search Console

1. Ga naar <https://search.google.com/search-console>
2. **Add property** → kies **Domain** (DNS-verification, dekt alle subdomeinen)
3. Volg de DNS TXT-record instructies (record toevoegen bij de DNS-host van
   `klushulpgids.nl`)
4. Wacht tot Google de TXT vindt → **Verify**
5. Submit sitemap:
   - Sitemaps → **Add a new sitemap** → `sitemap.xml`
   - Verwacht: ~7900 URLs (12 vakgebieden × 100 steden, ~6500 vakman-profielen,
     blog, statics)
6. (Alternatief) HTML-tag-verification:
   - Zet de meta-content in env `GOOGLE_SITE_VERIFICATION` (Scalingo →
     Environment) → herdeploy → re-verify in GSC

**Indexering monitoren:** check eerste week dagelijks "Coverage". Verwacht
gradual uplift: dag 1 ~10 URLs, week 2 ~1000+, week 4 substantial.

## 2. Bing Webmaster Tools

1. Ga naar <https://www.bing.com/webmasters>
2. **Import from Google Search Console** (snelste route — vereist GSC-verified)
3. Submit sitemap (overgenomen uit GSC) of handmatig: `sitemap.xml`
4. (Alternatief) HTML-tag: zet env `BING_SITE_VERIFICATION` → herdeploy

## 3. Yandex Webmaster (optioneel)

Alleen relevant bij significant Russisch/Oost-Europees verkeer — voor NL niet
prioritair. Skip voor nu.

## 4. Plausible — verifieer event-tracking

`PUBLIC_URL` van Plausible-script is reeds geconfigureerd in `app/layout.tsx`.
Verifieer:

1. <https://plausible.io/klushulpgids.nl>
2. Open de site in incognito → `Realtime` dashboard moet binnen 30s tonen

## 5. OG-image preview testen

OG-images zijn dynamisch via `/api/og?vak=...&stad=...`.

Test:

```bash
# Lokale preview
curl -o og-test.png 'http://localhost:3000/api/og?vak=Loodgieters&stad=Amsterdam'

# Productie
curl -o og-prod.png 'https://klushulpgids.nl/api/og?vak=Loodgieters&stad=Amsterdam'
```

Verifieer in:

- <https://www.opengraph.xyz/>
- <https://cards-dev.twitter.com/validator>
- LinkedIn Post Inspector

## 6. Schema.org validatie

Voer voor minstens 4 pagina-types uit:

1. <https://search.google.com/test/rich-results>
2. Plak URL:
   - Homepage → verwacht: Organization + WebSite
   - `/loodgieters/amsterdam` → ItemList + BreadcrumbList + FAQPage
   - `/vakman/<slug>` → LocalBusiness + AggregateRating + BreadcrumbList
   - `/blog/<slug>` → Article + BreadcrumbList
3. Geen `Errors` toegestaan; `Warnings` triëren

Schema-bron: `lib/schema.ts`. JSON-LD wordt gerenderd via
`components/seo/JsonLd.tsx`.

## 7. AI-crawler strategie verifiëren

`app/robots.ts` blokkeert training-bots maar staat search-bots toe. Test:

```bash
curl -s https://klushulpgids.nl/robots.txt | grep -i "GPTBot\|OAI-SearchBot"
# Verwacht: GPTBot Disallow /
#           OAI-SearchBot allow (geen Disallow)
```

Achtergrond:

- **Training blokkeren** (GPTBot, ClaudeBot, Google-Extended, CCBot, ...): wij
  zijn een redactionele gids, content is ons asset
- **Real-time search toestaan** (OAI-SearchBot, PerplexityBot, Claude-User): we
  willen wel gevonden worden in AI-zoekresultaten met attribution
- **`public/llms.txt`** documenteert dit beleid expliciet voor agents die
  llms.txt respecteren

## 8. Redis caching (Scalingo)

Caching is no-op zonder `REDIS_URL`. Activeren:

```bash
scalingo --app klushulpgids addons-add redis redis-sandbox
# of redis-pro voor production
```

Scalingo zet automatisch `REDIS_URL` in de env. Eerstvolgende deploy gebruikt
de cache. Geen code-changes nodig — `lib/cache.ts` valt graceful terug.

Cache keys (voor monitoring):

- `vak-stad:stats:<vak>:<stad>` — TTL 1h
- `vak-stad:specialties:<vak>:<stad>` — TTL 1h
- `vak-stad:related-trades:<cityId>:<tradeId>` — TTL 1h
- `vak-stad:nearby-cities:<cityId>` — TTL 24h

Invalidatie bij data-imports: `redis-cli FLUSHDB` of via
`invalidatePattern('vak-stad:*')` in een script.

## 9. Lighthouse CI

`.github/workflows/lighthouse.yml` draait op iedere PR naar `main` tegen 5
production URLs. `.lighthouserc.json` definieert thresholds:

- Performance ≥ 0.85 (warn — niet hard fail, mobiel-meting kan fluctueren)
- Accessibility ≥ 0.95 (error)
- SEO ≥ 0.95 (error)

Resultaten worden geüpload naar temporary-public-storage; URL verschijnt in de
job-output.

## 10. Eerste-week monitoring

Dag 1 na go-live:

- [ ] GSC submitted sitemap, status `Success`
- [ ] `curl -A "Googlebot" https://klushulpgids.nl/robots.txt` → `Allow: /`
- [ ] OG-preview voor 1 vak×stad pagina rendert
- [ ] `/sitemap.xml` levert 7000+ URLs

Week 1:

- [ ] GSC `Coverage` toont indexed URLs (≥ 10)
- [ ] Geen `Manual Actions` of `Security issues`
- [ ] Plausible toont organic traffic (mogelijk 0 in week 1, dat is normaal)

Week 4:

- [ ] GSC indexed ≥ 1000 URLs
- [ ] Eerste rankings op long-tail queries (zoek `site:klushulpgids.nl
loodgieter amsterdam`)
