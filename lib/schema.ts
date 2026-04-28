/**
 * Schema.org JSON-LD helpers voor Klushulpgids.
 *
 * Elke functie returnt een plain object dat via {@link components/seo/JsonLd}
 * als <script type="application/ld+json"> wordt gerenderd.
 *
 * Validatie: Google Rich Results Test (https://search.google.com/test/rich-results)
 */

const BASE_URL = 'https://klushulpgids.nl'

type SchemaObject = Record<string, unknown>

// ============================================================================
// Organization & WebSite — root layout (homepage)
// ============================================================================

export function organizationSchema(): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}#organization`,
    name: 'Klushulpgids',
    legalName: 'Klushulpgids B.V.',
    url: BASE_URL,
    logo: `${BASE_URL}/icon.svg`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'redactie@klushulpgids.nl',
      contactType: 'editorial',
      availableLanguage: ['Dutch'],
    },
    description:
      'Onafhankelijke gids voor Nederlandse ambachtslieden — KvK-geverifieerd, geen lead-fee, geen tussenpersoon.',
  }
}

export function websiteSchema(): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}#website`,
    url: BASE_URL,
    name: 'Klushulpgids',
    inLanguage: 'nl-NL',
    publisher: { '@id': `${BASE_URL}#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/zoeken?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// ============================================================================
// BreadcrumbList — gebruikt op iedere subpagina
// ============================================================================

export type BreadcrumbInput = { name: string; url?: string }

export function breadcrumbSchema(items: BreadcrumbInput[]): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.url && {
        item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
      }),
    })),
  }
}

// ============================================================================
// LocalBusiness — vakman-profielpagina
// ============================================================================

type VakmanForSchema = {
  slug: string
  companyName: string
  description?: string | null
  phone?: string | null
  websiteUrl?: string | null
  street?: string | null
  houseNumber?: string | null
  postalCode?: string | null
  latitude?: number | null
  longitude?: number | null
  ratingAvg?: number | null
  ratingCount?: number | null
  googleRating?: number | null
  googleReviewsCount?: number | null
  city?: { name: string; province: string } | null
  trades?: Array<{ trade: { nameSingular: string } }>
  foundedYear?: number | null
}

export function localBusinessSchema(v: VakmanForSchema): SchemaObject {
  const url = `${BASE_URL}/vakman/${v.slug}`
  const tradeName = v.trades?.[0]?.trade.nameSingular

  // Aggregate rating: prefer eigen reviews, anders Google
  const ratingValue = v.ratingAvg ?? v.googleRating
  const ratingCount = v.ratingAvg != null ? v.ratingCount : v.googleReviewsCount

  const schema: SchemaObject = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': url,
    name: v.companyName,
    url,
    ...(v.description && { description: v.description.slice(0, 500) }),
    ...(v.phone && { telephone: v.phone }),
    ...(v.websiteUrl && { sameAs: [v.websiteUrl] }),
    ...(v.foundedYear && { foundingDate: String(v.foundedYear) }),
  }

  // Adres — minimaal land + plaats; volledig als alle velden aanwezig
  if (v.city || v.street) {
    schema.address = {
      '@type': 'PostalAddress',
      addressCountry: 'NL',
      ...(v.city?.name && { addressLocality: v.city.name }),
      ...(v.city?.province && { addressRegion: v.city.province }),
      ...(v.postalCode && { postalCode: v.postalCode }),
      ...(v.street && {
        streetAddress: v.houseNumber ? `${v.street} ${v.houseNumber}` : v.street,
      }),
    }
  }

  // GeoCoordinates
  if (v.latitude != null && v.longitude != null) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: v.latitude,
      longitude: v.longitude,
    }
  }

  // Service-area (heuristic: zelfde provincie)
  if (v.city?.province) {
    schema.areaServed = {
      '@type': 'AdministrativeArea',
      name: v.city.province,
    }
  }

  // Aggregate rating
  if (ratingValue != null && ratingCount != null && ratingCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(ratingValue.toFixed(1)),
      reviewCount: ratingCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  // Categorie
  if (tradeName) {
    schema.knowsAbout = tradeName
  }

  return schema
}

// ============================================================================
// ItemList — vak×stad listings
// ============================================================================

type ListItemInput = {
  name: string
  url: string
  description?: string
}

export function itemListSchema(items: ListItemInput[], name?: string): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(name && { name }),
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
      ...(item.description && { description: item.description }),
      name: item.name,
    })),
  }
}

// ============================================================================
// FAQPage — voor pagina's met FAQ-sectie
// ============================================================================

export type FAQInput = { question: string; answer: string }

export function faqSchema(faqs: FAQInput[]): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }
}

// ============================================================================
// Article — blog-posts
// ============================================================================

type ArticleInput = {
  slug: string
  title: string
  excerpt: string
  body?: string
  authorName: string
  publishedAt: Date | string
  updatedAt: Date | string
  coverImageUrl?: string | null
  coverImageAlt?: string | null
}

export function articleSchema(post: ArticleInput): SchemaObject {
  const url = `${BASE_URL}/blog/${post.slug}`
  const published =
    typeof post.publishedAt === 'string' ? post.publishedAt : post.publishedAt.toISOString()
  const updated = typeof post.updatedAt === 'string' ? post.updatedAt : post.updatedAt.toISOString()

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': url,
    headline: post.title,
    description: post.excerpt,
    url,
    datePublished: published,
    dateModified: updated,
    inLanguage: 'nl-NL',
    author: { '@type': 'Person', name: post.authorName },
    publisher: { '@id': `${BASE_URL}#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(post.coverImageUrl && {
      image: {
        '@type': 'ImageObject',
        url: post.coverImageUrl,
        ...(post.coverImageAlt && { caption: post.coverImageAlt }),
      },
    }),
  }
}

// ============================================================================
// HowTo — voor blog-posts met stappenplan
// ============================================================================

export type HowToStep = {
  name: string
  text: string
  url?: string
  image?: string
}

export function howToSchema(post: ArticleInput, steps: HowToStep[]): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: post.title,
    description: post.excerpt,
    inLanguage: 'nl-NL',
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.url && { url: s.url }),
      ...(s.image && { image: s.image }),
    })),
  }
}

// ============================================================================
// Service / CollectionPage — vakgebied en stad index
// ============================================================================

export function collectionPageSchema(input: {
  name: string
  description: string
  url: string
}): SchemaObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: input.url.startsWith('http') ? input.url : `${BASE_URL}${input.url}`,
    inLanguage: 'nl-NL',
    isPartOf: { '@id': `${BASE_URL}#website` },
  }
}
