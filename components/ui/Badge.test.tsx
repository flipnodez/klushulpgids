import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Badge } from './Badge'

describe('Badge', () => {
  it('rendert children', () => {
    render(<Badge>Beschikbaar</Badge>)
    expect(screen.getByText('Beschikbaar')).toBeInTheDocument()
  })

  it('past variant-class toe', () => {
    const { container } = render(<Badge variant="success">OK</Badge>)
    expect(container.firstChild).toHaveClass('success')
  })

  it('toont dot wanneer dot=true', () => {
    const { container } = render(<Badge dot>Dot</Badge>)
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })

  it('rendert geen dot wanneer dot=false (default)', () => {
    const { container } = render(<Badge>Geen dot</Badge>)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  })
})
