import 'server-only'

import { button, emailShell, emDashLabel, h1, muted, paragraph } from './shared'

export function claimInviteTemplate({ companyName, url }: { companyName: string; url: string }): {
  html: string
  text: string
} {
  const html = emailShell({
    preheader: `Claim het gratis profiel voor ${companyName}`,
    body: [
      emDashLabel('Uw vermelding'),
      h1(`Claim het profiel van ${companyName}`),
      paragraph(
        'Uw bedrijf staat al opgenomen in de Klushulpgids — een onafhankelijke, redactionele gids voor Nederlandse vakmensen. Als eigenaar kunt u uw profiel <strong>gratis claimen</strong> en zelf bijwerken.',
      ),
      paragraph(
        'Wat u daarmee krijgt:<br>' +
          "• Foto's van uw werk toevoegen<br>" +
          '• Beschikbaarheid actualiseren<br>' +
          '• Reageren op klantbeoordelingen<br>' +
          '• Inzicht in profielweergaven en contact-clicks',
      ),
      button(url, 'Profiel claimen'),
      muted('Geen lead-fee. Geen commissie. U behoudt rechtstreeks contact met uw klanten.'),
      muted(
        'Niet uw bedrijf, of geen interesse? U kunt uw profiel ook laten verwijderen via de link onderaan deze e-mail.',
      ),
    ].join(''),
  })

  const text = [
    `Claim het profiel van ${companyName}`,
    '',
    'Uw bedrijf staat al opgenomen in de Klushulpgids — een onafhankelijke, redactionele',
    'gids voor Nederlandse vakmensen. Als eigenaar kunt u uw profiel gratis claimen.',
    '',
    'Wat u krijgt:',
    "  - Foto's van uw werk toevoegen",
    '  - Beschikbaarheid actualiseren',
    '  - Reageren op klantbeoordelingen',
    '  - Inzicht in profielweergaven',
    '',
    'Profiel claimen:',
    url,
    '',
    'Geen lead-fee. Geen commissie. U behoudt rechtstreeks contact met uw klanten.',
    '',
    'Klushulpgids — klushulpgids.nl',
  ].join('\n')

  return { html, text }
}
