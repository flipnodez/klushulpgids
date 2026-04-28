import 'server-only'

import { emailShell, emDashLabel, h1, muted, paragraph } from './shared'

export function deletionConfirmationTemplate({ companyName }: { companyName: string }): {
  html: string
  text: string
} {
  const html = emailShell({
    preheader: 'Uw profiel is verwijderd',
    body: [
      emDashLabel('Bevestiging'),
      h1('Uw profiel is verwijderd'),
      paragraph(
        `Wij hebben het profiel van <strong>${companyName}</strong> verwijderd uit de Klushulpgids. Onder de AVG is uw KvK-nummer toegevoegd aan onze opt-out lijst zodat het bedrijf niet automatisch opnieuw wordt opgenomen.`,
      ),
      paragraph(
        '<strong>Bedacht u zich?</strong> U kunt binnen 7 dagen contact opnemen met onze redactie om de verwijdering ongedaan te maken — daarna is herstel niet meer mogelijk.',
      ),
      muted(
        'Vragen over deze verwijdering? Mail naar support@klushulpgids.nl — wij reageren binnen één werkdag.',
      ),
    ].join(''),
  })

  const text = [
    'Uw profiel is verwijderd',
    '',
    `Wij hebben het profiel van ${companyName} verwijderd uit de Klushulpgids.`,
    'Onder de AVG is uw KvK-nummer toegevoegd aan onze opt-out lijst zodat',
    'het bedrijf niet automatisch opnieuw wordt opgenomen.',
    '',
    'Bedacht u zich? U kunt binnen 7 dagen contact opnemen met onze redactie',
    'om de verwijdering ongedaan te maken.',
    '',
    'Vragen? support@klushulpgids.nl',
    '',
    'Klushulpgids — klushulpgids.nl',
  ].join('\n')

  return { html, text }
}
