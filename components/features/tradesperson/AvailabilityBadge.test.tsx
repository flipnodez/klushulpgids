import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AvailabilityBadge } from './AvailabilityBadge'

describe('AvailabilityBadge', () => {
  it('toont label voor AVAILABLE_NOW', () => {
    render(<AvailabilityBadge status="AVAILABLE_NOW" />)
    expect(screen.getByText('Beschikbaar')).toBeInTheDocument()
  })

  it('toont dot bij AVAILABLE_NOW', () => {
    const { container } = render(<AvailabilityBadge status="AVAILABLE_NOW" />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('toont géén dot bij NOT_ACCEPTING', () => {
    const { container } = render(<AvailabilityBadge status="NOT_ACCEPTING" />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  })

  it('rendert correcte label voor elke status', () => {
    const cases = [
      { status: 'AVAILABLE_NOW' as const, label: 'Beschikbaar' },
      { status: 'AVAILABLE_THIS_WEEK' as const, label: 'Deze week beschikbaar' },
      { status: 'AVAILABLE_THIS_MONTH' as const, label: 'Deze maand beschikbaar' },
      { status: 'WAITLIST' as const, label: 'Wachtlijst' },
      { status: 'NOT_ACCEPTING' as const, label: 'Geen nieuwe klussen' },
      { status: 'UNKNOWN' as const, label: 'Status onbekend' },
    ]
    for (const { status, label } of cases) {
      const { unmount } = render(<AvailabilityBadge status={status} />)
      expect(screen.getByText(label)).toBeInTheDocument()
      unmount()
    }
  })

  it('toont updatedAt in title-attribuut', () => {
    const { container } = render(
      <AvailabilityBadge status="AVAILABLE_NOW" updatedAt="2026-04-20T10:00:00Z" />,
    )
    const badge = container.firstChild as HTMLElement
    expect(badge.title).toContain('Beschikbaar')
    expect(badge.title).toContain('2026')
  })
})
