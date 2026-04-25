import type { Meta, StoryObj } from '@storybook/react-vite'

import { Card } from './Card'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  args: {
    children: (
      <div>
        <h3 style={{ fontSize: 22, marginBottom: 8 }} className="serif">
          Een editorial card
        </h3>
        <p className="muted">
          1px ink border, geen rounded corners, geen schaduw — behalve bij <code>paper-stamp</code>.
        </p>
      </div>
    ),
    padding: 'md',
  },
}
export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = { args: { variant: 'default' } }
export const Soft: Story = { args: { variant: 'soft' } }
export const PaperStamp: Story = { args: { variant: 'paper-stamp' } }
export const Entry: Story = { args: { variant: 'entry' } }
