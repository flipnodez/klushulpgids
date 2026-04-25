import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { TradespersonCard } from './TradespersonCard'
import type { TradespersonCardData } from './TradespersonCard'

const FULL: TradespersonCardData = {
  slug: 'loodgieter-van-der-meer',
  companyName: 'Loodgietersbedrijf Van der Meer',
  cityName: 'Utrecht',
  tradeName: 'Loodgieter',
  foundedYear: 2004,
  ratingAvg: 4.8,
  ratingCount: 143,
  specialties: ['Lekkages', 'CV-ketels'],
  availabilityStatus: 'AVAILABLE_NOW',
  phone: '030 - 234 56 78',
  tier: 'PREMIUM',
}

describe('TradespersonCard', () => {
  it('rendert bedrijfsnaam in een h3', () => {
    render(<TradespersonCard data={FULL} />)
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Loodgietersbedrijf Van der Meer')
  })

  it('toont meta-info als middle-dot scheiders', () => {
    render(<TradespersonCard data={FULL} />)
    expect(screen.getByText(/Utrecht · Loodgieter · Sinds 2004/)).toBeInTheDocument()
  })

  it('toont specialisaties (max 4) gescheiden met middle-dot', () => {
    const data: TradespersonCardData = {
      ...FULL,
      specialties: ['Lekkages', 'CV-ketels', 'Riolering', 'Sanitair', 'Vijfde'],
    }
    render(<TradespersonCard data={data} />)
    // Maar 4 worden getoond
    expect(screen.getByText(/Lekkages · CV-ketels · Riolering · Sanitair$/)).toBeInTheDocument()
    expect(screen.queryByText(/Vijfde/)).toBeNull()
  })

  it('rendert telefoonnummer als tel: link', () => {
    render(<TradespersonCard data={FULL} />)
    const link = screen.getByText('030 - 234 56 78')
    expect(link.closest('a')).toHaveAttribute('href', 'tel:030-2345678')
  })

  it('valt terug op googleRating wanneer ratingAvg ontbreekt', () => {
    const data: TradespersonCardData = {
      ...FULL,
      ratingAvg: null,
      ratingCount: 0,
      googleRating: 4.2,
      googleReviewsCount: 87,
    }
    render(<TradespersonCard data={data} />)
    expect(screen.getByText('4.2')).toBeInTheDocument()
    expect(screen.getByText('(87)')).toBeInTheDocument()
  })

  it('zet data-tier op de card voor toekomstige styling', () => {
    const { container } = render(<TradespersonCard data={FULL} />)
    expect(container.querySelector('[data-tier="PREMIUM"]')).toBeInTheDocument()
  })

  it('handelt missende velden gracieus af', () => {
    const minimal: TradespersonCardData = {
      slug: 'min',
      companyName: 'Minimaal Bedrijf',
    }
    render(<TradespersonCard data={minimal} />)
    expect(screen.getByText('Minimaal Bedrijf')).toBeInTheDocument()
    // Geen rating, geen meta, geen phone — geen crash
    expect(screen.queryByText(/Sinds/)).toBeNull()
  })

  it('rendert als link wanneer href is meegegeven', () => {
    const { container } = render(<TradespersonCard data={FULL} href="/loodgieter-van-der-meer" />)
    expect(container.querySelector('a[href="/loodgieter-van-der-meer"]')).toBeInTheDocument()
  })
})
