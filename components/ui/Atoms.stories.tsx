import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './Badge'
import { Icon, ICON_MAP } from './Icon'
import { Stars } from './Stars'

const meta: Meta = {
  title: 'UI/Atoms',
}
export default meta

export const Badges: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Badge>Default</Badge>
      <Badge variant="accent">Accent</Badge>
      <Badge variant="success" dot>
        Beschikbaar
      </Badge>
      <Badge variant="muted">Muted</Badge>
    </div>
  ),
}

export const StarsAllRatings: StoryObj = {
  name: 'Stars — diverse ratings',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Stars rating={5.0} reviews={221} showNumber />
      <Stars rating={4.7} reviews={143} showNumber />
      <Stars rating={4.3} reviews={87} showNumber />
      <Stars rating={3.5} reviews={42} showNumber />
      <Stars rating={2.0} showNumber />
      <Stars rating={4.7} size="lg" reviews={221} showNumber />
    </div>
  ),
}

export const IconsAll: StoryObj = {
  name: 'Iconen (volledige set, strokeWidth 1.5)',
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 16,
      }}
    >
      {(Object.keys(ICON_MAP) as Array<keyof typeof ICON_MAP>).map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            border: '1px solid var(--rule-soft)',
          }}
        >
          <Icon name={name} size={24} />
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{name}</span>
        </div>
      ))}
    </div>
  ),
}

export const IconStrokeComparison: StoryObj = {
  name: 'Icon — stroke 1.5 vs default',
  render: () => (
    <div style={{ display: 'flex', gap: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Icon name="Wrench" size={48} strokeWidth={1.5} />
        <code>strokeWidth: 1.5 (editorial)</code>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Icon name="Wrench" size={48} strokeWidth={2} />
        <code>strokeWidth: 2 (default — TE DIK)</code>
      </div>
    </div>
  ),
}
