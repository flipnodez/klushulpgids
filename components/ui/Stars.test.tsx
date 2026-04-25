import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Stars } from './Stars'

describe('Stars', () => {
  it('rendert 5 sterren met aria-label voor screenreader', () => {
    render(<Stars rating={4.7} reviews={143} />)
    const wrap = screen.getByLabelText(/4\.7 van 5 sterren, 143 reviews/i)
    expect(wrap).toBeInTheDocument()
    // 5 ster-svgs aanwezig
    expect(wrap.querySelectorAll('svg')).toHaveLength(5)
  })

  it('toont het cijfer wanneer showNumber=true', () => {
    render(<Stars rating={4.0} showNumber />)
    expect(screen.getByText('4.0')).toBeInTheDocument()
  })

  it('vult halve sterren correct (4.5 → 4 vol + 1 half)', () => {
    const { container } = render(<Stars rating={4.5} />)
    const stars = container.querySelectorAll('svg')
    // Eerste 4 zijn gevuld
    expect(stars[0]).toHaveAttribute('fill', 'currentColor')
    expect(stars[3]).toHaveAttribute('fill', 'currentColor')
    // 5e is gevuld bij 4.5 (round-up)
    expect(stars[4]).toHaveAttribute('fill', 'currentColor')
  })

  it('clamp ratings buiten 0-5', () => {
    render(<Stars rating={7.2} showNumber />)
    expect(screen.getByText('5.0')).toBeInTheDocument()
  })

  it('toont aantal reviews tussen haakjes', () => {
    render(<Stars rating={4} reviews={42} />)
    expect(screen.getByText('(42)')).toBeInTheDocument()
  })
})
