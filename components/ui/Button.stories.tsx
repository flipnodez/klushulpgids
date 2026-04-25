import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Bekijk profiel' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'link', 'accent'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    fullWidth: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = { args: { variant: 'primary' } }
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Link: Story = { args: { variant: 'link' } }
export const Accent: Story = { args: { variant: 'accent' } }

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button size="sm">Klein</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Groot</Button>
    </div>
  ),
}

export const AsLink: Story = {
  args: { href: 'https://klushulpgids.nl', target: '_blank' },
}

export const Disabled: Story = {
  args: { disabled: true },
}
