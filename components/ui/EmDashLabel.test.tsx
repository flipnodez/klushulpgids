import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { EmDashLabel } from './EmDashLabel'

describe('EmDashLabel', () => {
  it('rendert vier em-dashes als aria-hidden prefix', () => {
    const { container } = render(<EmDashLabel>Hoofdartikel</EmDashLabel>)
    const dashes = container.querySelector('[aria-hidden="true"]')
    expect(dashes).toBeInTheDocument()
    expect(dashes?.textContent).toBe('————')
  })

  it('toont alleen de label-tekst voor screenreaders (em-dashes hidden)', () => {
    render(<EmDashLabel>Hoofdartikel</EmDashLabel>)
    expect(screen.getByText('Hoofdartikel', { exact: false })).toBeInTheDocument()
  })

  it('respecteert variant prop', () => {
    const { container } = render(<EmDashLabel variant="accent">Accent</EmDashLabel>)
    expect(container.firstChild).toHaveClass('label-accent')
  })
})
