import type { Meta, StoryObj } from '@storybook/react-vite'

import { SearchResults } from './search/SearchResults'

const meta: Meta = {
  title: 'Features/Search',
  parameters: { layout: 'fullscreen' },
}
export default meta

const SAMPLES = [
  {
    slug: 'loodgieter-van-der-meer',
    companyName: 'Loodgietersbedrijf Van der Meer',
    cityName: 'Utrecht',
    tradeName: 'Loodgieter',
    foundedYear: 2004,
    ratingAvg: 4.8,
    ratingCount: 143,
    specialties: ['Lekkages', 'CV-ketels'],
    availabilityStatus: 'AVAILABLE_NOW' as const,
    phone: '030 - 234 56 78',
  },
  {
    slug: 'de-jong-installaties',
    companyName: 'De Jong Installaties',
    cityName: 'Utrecht',
    tradeName: 'Loodgieter',
    foundedYear: 2011,
    ratingAvg: 4.6,
    ratingCount: 87,
    specialties: ['Badkamers', 'Keuken-aansluitingen'],
    availabilityStatus: 'AVAILABLE_THIS_WEEK' as const,
    phone: '030 - 789 12 34',
  },
  {
    slug: 'bos-loodgieters',
    companyName: 'Bos & Zn. Loodgieters',
    cityName: 'Utrecht',
    tradeName: 'Loodgieter',
    foundedYear: 1987,
    ratingAvg: 4.9,
    ratingCount: 221,
    specialties: ['CV-ketels', 'Warmtepompen', 'Vloerverwarming'],
    availabilityStatus: 'WAITLIST' as const,
    phone: '030 - 261 44 88',
  },
]

export const Default: StoryObj = {
  render: () => (
    <div style={{ padding: 48, maxWidth: 800 }}>
      <SearchResults results={SAMPLES} totalCount={87} hasMore />
    </div>
  ),
}

export const Empty: StoryObj = {
  render: () => (
    <div style={{ padding: 48, maxWidth: 800 }}>
      <SearchResults results={[]} totalCount={0} />
    </div>
  ),
}
