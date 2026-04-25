import type { Meta, StoryObj } from '@storybook/react-vite'

import { ReviewCard } from './review/ReviewCard'

const meta: Meta = {
  title: 'Features/Review',
}
export default meta

export const Default: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <ReviewCard
        review={{
          id: '1',
          reviewerName: 'Marieke S.',
          reviewerCity: 'Utrecht',
          rating: 5,
          title: 'Snelle lekkage-reparatie',
          body: 'Binnen 90 minuten na mijn telefoontje stonden ze voor de deur. Lekkage in de badkamer professioneel verholpen. Nette offerte vooraf, geen verrassingen achteraf. Zeker een aanrader.',
          jobDate: '2026-03',
          createdAt: '2026-03-12',
          verificationMethod: 'EMAIL_CONFIRMED',
        }}
      />
    </div>
  ),
}

export const WithOwnerResponse: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <ReviewCard
        review={{
          id: '2',
          reviewerName: 'Saskia de B.',
          reviewerCity: 'Utrecht',
          rating: 4,
          title: 'Badkamer gerenoveerd',
          body: 'Complete badkamer vernieuwd. Ging vakkundig en netjes. Planning liep 3 dagen uit door vertraging materialen, maar daar was goed over gecommuniceerd. Eindresultaat prima.',
          createdAt: '2026-02-14',
          verificationMethod: 'EMAIL_CONFIRMED',
          ownerResponse:
            'Dank u wel voor uw beoordeling, Saskia. De vertraging in de levering was vervelend voor ons allebei — fijn dat u de communicatie waardeerde.',
          ownerResponseAt: '2026-02-16',
          companyName: 'Loodgietersbedrijf Van der Meer',
        }}
      />
    </div>
  ),
}

export const KvkVerified: StoryObj = {
  name: 'KvK-geverifieerd',
  render: () => (
    <div style={{ maxWidth: 720 }}>
      <ReviewCard
        review={{
          id: '3',
          reviewerName: 'Hans K.',
          reviewerCity: 'Amsterdam',
          rating: 5,
          body: 'Snel, vakkundig en eerlijk geprijsd. Wat wil je nog meer.',
          createdAt: '2026-02-03',
          verificationMethod: 'KVK_VERIFIED',
        }}
      />
    </div>
  ),
}
