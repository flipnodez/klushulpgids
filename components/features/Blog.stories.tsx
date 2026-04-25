import type { Meta, StoryObj } from '@storybook/react-vite'

import { BlogCard } from './blog/BlogCard'

const meta: Meta = {
  title: 'Features/Blog',
}
export default meta

export const Default: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <BlogCard
        href="#"
        data={{
          slug: 'wat-kost-een-loodgieter',
          title: 'Wat kost een loodgieter in Nederland?',
          excerpt:
            'Tarieven verschillen sterk per regio en specialisme. We zetten gemiddelde uurprijzen op een rij, plus de vier dingen die het tarief omhoog of omlaag drijven.',
          category: 'KOSTEN',
          authorName: 'Klushulpgids Redactie',
          publishedAt: '2026-03-22',
          readingMinutes: 7,
        }}
      />
    </div>
  ),
}

export const WithCover: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <BlogCard
        href="#"
        data={{
          slug: 'warmtepomp-isde',
          title: 'Warmtepomp en de ISDE-subsidie',
          excerpt:
            'Een hybride of volledige warmtepomp wordt sinds 2024 standaard ondersteund door de ISDE. Maar wanneer is het de moeite waard, en wat moet u uw monteur vragen?',
          coverImageUrl:
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
          coverImageAlt: 'Warmtepomp aan een buitenmuur',
          category: 'VERDUURZAMEN',
          publishedAt: '2026-03-08',
          readingMinutes: 11,
        }}
      />
    </div>
  ),
}

export const Compact: StoryObj = {
  name: 'Compact (zonder cover)',
  render: () => (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <BlogCard
        layout="compact"
        href="#"
        data={{
          slug: 'kvk-controle',
          title: 'Hoe controleert u of een vakman echt KvK-geregistreerd is?',
          excerpt: 'Eén klik bij de KvK toont meer dan u denkt. Drie stappen.',
          category: 'TIPS',
          publishedAt: '2026-04-01',
          readingMinutes: 4,
        }}
      />
      <BlogCard
        layout="compact"
        href="#"
        data={{
          slug: 'asbest',
          title: 'Asbest in een woning uit 1975: waar moet u op letten?',
          excerpt: 'Een korte gids voor wie een vooroorlogs of jaren-70 huis renoveert.',
          category: 'REGELGEVING',
          publishedAt: '2026-03-15',
          readingMinutes: 9,
        }}
      />
    </div>
  ),
}
