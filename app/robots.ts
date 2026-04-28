import type { MetadataRoute } from 'next'

/**
 * Gedifferentieerde robots-strategie:
 *
 *  - Default (alle traditional search bots): allow alles behalve /api en /zoeken
 *  - AI training bots: GEBLOKKEERD (geen content-scraping voor model-training)
 *  - AI search/grounding bots: TOEGESTAAN met bronvermelding
 *
 * Aanvulling: X-Robots-Tag header bevat `noai, noimageai` (next.config.js).
 * Dit is een hint voor AI-systemen die headers respecteren bovenop robots.txt.
 *
 * Zie ook /llms.txt voor menselijk-leesbare AI-policy.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Default: traditional search engines ─────────────────────────────
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/zoeken'],
      },

      // ── AI TRAINING — BLOCK ──────────────────────────────────────────────
      // Deze bots scrapen content voor training van foundation models.
      // We staan dat niet toe; de gids is editorial product, geen training-corpus.
      ...[
        'GPTBot',
        'GPTBot/2.0',
        'ChatGPT-User',
        'ClaudeBot',
        'anthropic-ai',
        'Google-Extended',
        'CCBot',
        'cohere-ai',
        'cohere-training-data-crawler',
        'meta-externalagent',
        'FacebookBot',
        'Bytespider',
        'Amazonbot',
        'Applebot-Extended',
        'Diffbot',
        'PetalBot',
        'omgili',
        'DataForSeoBot',
        'AhrefsBot',
        'SemrushBot',
      ].map((agent) => ({
        userAgent: agent,
        disallow: '/',
      })),

      // ── AI SEARCH / GROUNDING — ALLOW ────────────────────────────────────
      // Deze bots gebruiken content live met bronvermelding (geen training).
      // Toestaan zorgt dat we vindbaar zijn in ChatGPT search, Perplexity, etc.
      ...[
        'OAI-SearchBot',
        'PerplexityBot',
        'Perplexity-User',
        'Claude-User',
        'Claude-SearchBot',
        'YouBot',
        'GoogleOther',
        'Applebot',
      ].map((agent) => ({
        userAgent: agent,
        allow: '/',
        disallow: ['/api/', '/zoeken'],
      })),
    ],
    sitemap: 'https://klushulpgids.nl/sitemap.xml',
    host: 'https://klushulpgids.nl',
  }
}
