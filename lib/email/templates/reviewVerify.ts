import 'server-only'

import { button, emailShell, emDashLabel, escapeHtml, h1, muted, paragraph } from './shared'

export function reviewVerifyTemplate({ companyName, url }: { companyName: string; url: string }): {
  html: string
  text: string
} {
  const html = emailShell({
    preheader: `Bevestig dat u een review wilt achterlaten voor ${companyName}`,
    body: [
      emDashLabel('Reviews'),
      h1('Schrijf uw review'),
      paragraph(
        `Klik op de knop hieronder om uw review voor <strong>${escapeHtml(companyName)}</strong> te schrijven. Wij vragen om e-mailverificatie zodat alleen mensen die echt klant waren een review kunnen achterlaten.`,
      ),
      button(url, 'Review schrijven'),
      muted(
        'Deze link is 24 uur geldig en kan eenmalig worden gebruikt. Heeft u dit verzoek niet gedaan? Negeer deze e-mail.',
      ),
      muted(
        'Reviews worden door onze redactie gemodereerd voordat ze verschijnen. Wij plaatsen uw e-mailadres niet zichtbaar bij de review.',
      ),
    ].join(''),
  })

  const text = [
    `Schrijf uw review voor ${companyName}`,
    '',
    'Klik op deze link om uw review te schrijven (24 uur geldig):',
    '',
    url,
    '',
    'Heeft u dit verzoek niet gedaan? Negeer deze e-mail.',
    '',
    'Klushulpgids — klushulpgids.nl',
  ].join('\n')

  return { html, text }
}
