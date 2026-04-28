/**
 * Render één of meerdere JSON-LD blocks als <script type="application/ld+json">.
 *
 * Gebruik:
 *   import { JsonLd } from '@/components/seo/JsonLd'
 *   import { breadcrumbSchema, localBusinessSchema } from '@/lib/schema'
 *
 *   <JsonLd data={[breadcrumbSchema(...), localBusinessSchema(...)]} />
 *
 * Note: server-rendered (geen 'use client'). Volgt de Next.js 15 best-practice
 * voor structured data — geplaatst in body, niet head.
 */

type Props = {
  data: object | object[]
}

export function JsonLd({ data }: Props) {
  const items = Array.isArray(data) ? data : [data]
  return (
    <>
      {items.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
