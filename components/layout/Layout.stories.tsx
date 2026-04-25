import type { Meta, StoryObj } from '@storybook/react-vite'

import { Stamp } from '../ui/Stamp'
import { Breadcrumbs } from './Breadcrumbs'
import { Footer } from './Footer'
import { Header } from './Header'

const meta: Meta = {
  title: 'Layout',
  parameters: { layout: 'fullscreen' },
}
export default meta

export const HeaderDefault: StoryObj = {
  name: 'Header — default (datum-stempel)',
  render: () => <Header />,
}

export const HeaderActive: StoryObj = {
  name: 'Header — actieve link',
  render: () => (
    <Header
      nav={[
        { label: 'Home', href: '/' },
        { label: 'Vakgebieden', href: '/vakgebieden', current: true },
        { label: 'Steden', href: '/steden' },
        { label: 'Zoeken', href: '/zoek' },
      ]}
    />
  ),
}

export const FooterDefault: StoryObj = {
  name: 'Footer — default',
  render: () => (
    <Footer
      stamps={
        <>
          <Stamp>✓ Onafhankelijk</Stamp>
          <Stamp>◆ KvK-geverifieerd</Stamp>
        </>
      }
      legal="KvK 90123456 · Utrecht"
    />
  ),
}

export const BreadcrumbsExample: StoryObj = {
  name: 'Breadcrumbs',
  parameters: { layout: 'padded' },
  render: () => (
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/' },
        { label: 'Vakgebieden', href: '/vakgebieden' },
        { label: 'Loodgieters', href: '/loodgieters' },
        { label: 'Loodgieters in Utrecht' },
      ]}
    />
  ),
}
