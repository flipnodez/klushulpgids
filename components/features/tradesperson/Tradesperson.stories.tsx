import type { Meta, StoryObj } from '@storybook/react-vite'

import { AssociationList } from './AssociationList'
import { AvailabilityBadge } from './AvailabilityBadge'
import { CertificationList } from './CertificationList'
import { ContactBlock } from './ContactBlock'
import { TradespersonCard } from './TradespersonCard'
import type { TradespersonCardData } from './TradespersonCard'
import { TradespersonHero } from './TradespersonHero'

const meta: Meta = {
  title: 'Features/Tradesperson',
}
export default meta

const SAMPLE: TradespersonCardData = {
  slug: 'loodgieter-van-der-meer',
  companyName: 'Loodgietersbedrijf Van der Meer',
  cityName: 'Utrecht',
  tradeName: 'Loodgieter',
  foundedYear: 2004,
  ratingAvg: 4.8,
  ratingCount: 143,
  specialties: ['Lekkages', 'CV-ketels', 'Riolering', 'Sanitair'],
  availabilityStatus: 'AVAILABLE_NOW',
  availabilityUpdatedAt: '2026-04-22',
  phone: '030 - 234 56 78',
  tier: 'PRO',
}

export const CardFull: StoryObj = {
  name: 'Card — alle velden',
  render: () => <TradespersonCard data={SAMPLE} href="/loodgieter-van-der-meer" />,
}

export const CardCompact: StoryObj = {
  name: 'Card — minimaal',
  render: () => (
    <TradespersonCard
      data={{
        slug: 'min',
        companyName: 'Minimaal Bedrijf',
        cityName: 'Amsterdam',
        tradeName: 'Schilder',
      }}
      href="/min"
    />
  ),
}

export const CardOnWaitlist: StoryObj = {
  render: () => (
    <TradespersonCard
      data={{ ...SAMPLE, availabilityStatus: 'WAITLIST', availabilityUpdatedAt: '2026-04-15' }}
      href="/loodgieter-van-der-meer"
    />
  ),
}

export const HeroFull: StoryObj = {
  name: 'Hero — profielpagina',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ padding: '32px 48px' }}>
      <TradespersonHero
        companyName="Bos & Zn. Loodgieters"
        italicWord="Utrecht"
        subtitle="Loodgieter · Sinds 1987"
        description="Familiebedrijf sinds 1987. Drie generaties loodgieters, gespecialiseerd in monumentale panden en duurzame installaties. Werken doordeweeks en in spoedgevallen ook in het weekend."
        withDropCap
        rating={{ rating: 4.9, reviews: 221 }}
        stats={[
          { label: 'KvK', value: '30128876' },
          { label: 'Sinds', value: '1987' },
          { label: 'Medewerkers', value: '8-15' },
          { label: 'Beoordeling', value: '4.9★ (221)' },
        ]}
      />
    </div>
  ),
}

export const AvailabilityAll: StoryObj = {
  name: 'AvailabilityBadge — alle statussen',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <AvailabilityBadge status="AVAILABLE_NOW" updatedAt="2026-04-22" />
      <AvailabilityBadge status="AVAILABLE_THIS_WEEK" updatedAt="2026-04-22" />
      <AvailabilityBadge status="AVAILABLE_THIS_MONTH" updatedAt="2026-04-22" />
      <AvailabilityBadge status="WAITLIST" updatedAt="2026-04-15" />
      <AvailabilityBadge status="NOT_ACCEPTING" updatedAt="2026-04-10" />
      <AvailabilityBadge status="UNKNOWN" />
    </div>
  ),
}

export const Contact: StoryObj = {
  name: 'ContactBlock',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <ContactBlock
        phone="030 - 234 56 78"
        email="info@vandermeerloodgieters.nl"
        websiteUrl="https://vandermeerloodgieters.nl"
      />
    </div>
  ),
}

export const Certifications: StoryObj = {
  name: 'CertificationList — list view',
  render: () => (
    <div style={{ maxWidth: 600 }}>
      <CertificationList
        layout="list"
        items={[
          { id: '1', name: 'VCA**', description: 'Veiligheid Checklist Aannemers' },
          {
            id: '2',
            name: 'Techniek Nederland',
            description: 'Erkenning installatietechniek',
          },
          { id: '3', name: 'F-gassen', description: 'Vereist voor warmtepomp-installatie' },
        ]}
      />
    </div>
  ),
}

export const Associations: StoryObj = {
  name: 'AssociationList — inline + list',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <AssociationList
        items={[
          { id: '1', name: 'Techniek Nederland' },
          { id: '2', name: 'BouwGarant' },
        ]}
      />
      <AssociationList
        inline
        items={[
          { id: '1', name: 'InstallQ' },
          { id: '2', name: 'Uneto-VNI' },
        ]}
      />
    </div>
  ),
}
