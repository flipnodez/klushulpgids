import type { Meta, StoryObj } from '@storybook/react-vite'

import { CategoryGrid } from './category/CategoryGrid'
import { CityGrid } from './city/CityGrid'

const meta: Meta = {
  title: 'Features/Grids',
  parameters: { layout: 'fullscreen' },
}
export default meta

export const Categories: StoryObj = {
  name: 'CategoryGrid (4 kolommen)',
  render: () => (
    <div style={{ padding: 48 }}>
      <CategoryGrid
        items={[
          { slug: 'loodgieters', name: 'Loodgieters', iconName: 'Wrench', count: 1247, href: '#' },
          { slug: 'elektriciens', name: 'Elektriciens', iconName: 'Zap', count: 892, href: '#' },
          { slug: 'schilders', name: 'Schilders', iconName: 'PaintBucket', count: 1514, href: '#' },
          { slug: 'stukadoors', name: 'Stukadoors', iconName: 'Layers', count: 421, href: '#' },
          {
            slug: 'tegelzetters',
            name: 'Tegelzetters',
            iconName: 'Grid3x3',
            count: 538,
            href: '#',
          },
          { slug: 'timmerlieden', name: 'Timmerlieden', iconName: 'Hammer', count: 973, href: '#' },
          { slug: 'dakdekkers', name: 'Dakdekkers', iconName: 'Home', count: 612, href: '#' },
          { slug: 'hoveniers', name: 'Hoveniers', iconName: 'Trees', count: 1089, href: '#' },
          {
            slug: 'klusbedrijven',
            name: 'Klusbedrijven',
            iconName: 'HardHat',
            count: 2104,
            href: '#',
          },
          { slug: 'cv-monteurs', name: 'CV-monteurs', iconName: 'Flame', count: 487, href: '#' },
          { slug: 'glaszetters', name: 'Glaszetters', iconName: 'Square', count: 234, href: '#' },
          {
            slug: 'vloerenleggers',
            name: 'Vloerenleggers',
            iconName: 'Square',
            count: 396,
            href: '#',
          },
        ]}
      />
    </div>
  ),
}

export const Cities: StoryObj = {
  name: 'CityGrid (4 kolommen)',
  render: () => (
    <div style={{ padding: 48 }}>
      <CityGrid
        showProvince
        items={[
          {
            slug: 'amsterdam',
            name: 'Amsterdam',
            province: 'Noord-Holland',
            count: 3421,
            href: '#',
          },
          {
            slug: 'rotterdam',
            name: 'Rotterdam',
            province: 'Zuid-Holland',
            count: 2894,
            href: '#',
          },
          { slug: 'den-haag', name: 'Den Haag', province: 'Zuid-Holland', count: 2103, href: '#' },
          { slug: 'utrecht', name: 'Utrecht', province: 'Utrecht', count: 1876, href: '#' },
          {
            slug: 'eindhoven',
            name: 'Eindhoven',
            province: 'Noord-Brabant',
            count: 1542,
            href: '#',
          },
          { slug: 'groningen', name: 'Groningen', province: 'Groningen', count: 987, href: '#' },
          { slug: 'tilburg', name: 'Tilburg', province: 'Noord-Brabant', count: 1104, href: '#' },
          { slug: 'almere', name: 'Almere', province: 'Flevoland', count: 823, href: '#' },
        ]}
      />
    </div>
  ),
}
