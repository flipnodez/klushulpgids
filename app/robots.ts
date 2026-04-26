import type { MetadataRoute } from 'next'

/**
 * Tijdens de bouw-fases (fase 1-4) verbieden we alle crawlers expliciet.
 * Dit is *belt-and-suspenders* naast de `noindex, nofollow` meta-tag in
 * `app/layout.tsx`:
 *  - meta robots: "als je hier komt, indexeer niet"
 *  - robots.txt: "kom hier niet eens langs"
 *
 * In fase 5 wordt dit omgezet naar `allow: ['/']` zodra de site SEO-klaar is
 * (sitemap, schema.org, definitieve meta).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  }
}
