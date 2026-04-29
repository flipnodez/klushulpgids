import 'server-only'

import { button, emailShell, emDashLabel, h1, muted, paragraph } from './shared'

export function unsubscribeConfirmTemplate({
  companyName,
  url,
}: {
  companyName: string
  url: string
}): { html: string; text: string } {
  const html = emailShell({
    preheader: `Bevestig verwijdering van ${companyName} uit Klushulpgids`,
    body: [
      emDashLabel('Uitschrijven'),
      h1('Bevestig verwijdering profiel'),
      paragraph(
        `U heeft verzocht om het profiel van <strong>${companyName}</strong> te laten verwijderen uit de Klushulpgids. Klik op de knop hieronder om dit definitief te bevestigen.`,
      ),
      button(url, 'Bevestig verwijdering'),
      muted(
        'Deze link is 24 uur geldig en kan eenmalig worden gebruikt. Heeft u dit verzoek niet gedaan? Negeer deze e-mail — er gebeurt niets.',
      ),
      muted(
        'Na bevestiging worden uw profiel, foto’s, reviews en account binnen enkele seconden verwijderd. Onder de AVG voegen wij uw KvK-nummer toe aan een opt-out-lijst zodat het bedrijf niet automatisch opnieuw wordt opgenomen.',
      ),
    ].join(''),
  })

  const text = [
    `Bevestig verwijdering van ${companyName}`,
    '',
    'U heeft verzocht om uw profiel te laten verwijderen uit de Klushulpgids.',
    'Klik op deze link om de verwijdering te bevestigen (24 uur geldig):',
    '',
    url,
    '',
    'Heeft u dit verzoek niet gedaan? Negeer deze e-mail.',
    '',
    'Klushulpgids — klushulpgids.nl',
  ].join('\n')

  return { html, text }
}
