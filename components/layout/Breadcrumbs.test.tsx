import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Breadcrumbs } from './Breadcrumbs'

describe('Breadcrumbs', () => {
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Vakgebieden', href: '/vakgebieden' },
    { label: 'Loodgieters' }, // current page = no href
  ]

  it('rendert alle items', () => {
    render(<Breadcrumbs items={items} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Vakgebieden')).toBeInTheDocument()
    expect(screen.getByText('Loodgieters')).toBeInTheDocument()
  })

  it('zet aria-current op de laatste item', () => {
    render(<Breadcrumbs items={items} />)
    expect(screen.getByText('Loodgieters')).toHaveAttribute('aria-current', 'page')
  })

  it('rendert links voor non-current items', () => {
    render(<Breadcrumbs items={items} />)
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/')
    expect(screen.getByText('Vakgebieden').closest('a')).toHaveAttribute('href', '/vakgebieden')
    expect(screen.getByText('Loodgieters').closest('a')).toBeNull()
  })

  it('rendert JSON-LD BreadcrumbList schema', () => {
    const { container } = render(<Breadcrumbs items={items} origin="https://klushulpgids.nl" />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
    const json = JSON.parse(script!.textContent!)
    expect(json['@type']).toBe('BreadcrumbList')
    expect(json.itemListElement).toHaveLength(3)
    expect(json.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://klushulpgids.nl/',
    })
    // laatste item heeft geen `item` (current page)
    expect(json.itemListElement[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: 'Loodgieters',
    })
  })

  it('rendert niets bij lege items', () => {
    const { container } = render(<Breadcrumbs items={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
