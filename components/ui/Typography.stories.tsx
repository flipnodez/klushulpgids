import type { Meta, StoryObj } from '@storybook/react-vite'

import { DropCap } from './DropCap'
import { EmDashLabel } from './EmDashLabel'
import { Label } from './Label'
import { Logo } from './Logo'
import { Rule } from './Rule'
import { Stamp } from './Stamp'

const meta: Meta = {
  title: 'UI/Typography & helpers',
}
export default meta

export const LogoAllSizes: StoryObj = {
  name: 'Logo (alle maten)',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Logo size="sm" />
      <Logo size="md" />
      <Logo size="lg" />
    </div>
  ),
}

export const Labels: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Label>Default label</Label>
      <Label variant="muted">Muted label</Label>
      <Label variant="accent">Accent label</Label>
    </div>
  ),
}

export const EmDashLabels: StoryObj = {
  name: 'EmDashLabel — signature pattern',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <EmDashLabel>Hoofdartikel</EmDashLabel>
      <EmDashLabel variant="accent">Onze belofte</EmDashLabel>
      <EmDashLabel variant="muted">In ontwikkeling</EmDashLabel>
    </div>
  ),
}

export const Rules: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Label variant="muted">default (1px ink)</Label>
      <Rule />
      <Label variant="muted">thick (3px ink)</Label>
      <Rule variant="thick" />
      <Label variant="muted">soft (1px subtle)</Label>
      <Rule variant="soft" />
    </div>
  ),
}

export const Stamps: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Stamp>✓ Onafhankelijk</Stamp>
      <Stamp>◆ KvK-geverifieerd</Stamp>
      <Stamp>Editorial</Stamp>
    </div>
  ),
}

export const DropCapStory: StoryObj = {
  name: 'DropCap',
  render: () => (
    <DropCap style={{ maxWidth: 560, fontFamily: 'var(--font-serif-fallback)' }}>
      De vakman om de hoek, zonder gedoe. Klushulpgids vergelijkt geen aanbiedingen — wij tonen waar
      de gids ze bewaart, met certificeringen, beschikbaarheid en eerlijke reviews. Een gids, geen
      makelaar.
    </DropCap>
  ),
}
