import 'server-only'

import { emailShell, emDashLabel, escapeHtml, h1, muted, paragraph } from './shared'

export function reviewReceivedTemplate({ companyName }: { companyName: string }): {
  html: string
  text: string
} {
  const html = emailShell({
    preheader: `Bedankt voor uw review op ${companyName}`,
    body: [
      emDashLabel('Bevestiging'),
      h1('Uw review is ontvangen'),
      paragraph(
        `Bedankt voor het schrijven van een review voor <strong>${escapeHtml(companyName)}</strong>. Onze redactie controleert binnen 48 uur of de review aan onze richtlijnen voldoet en plaatst hem dan op het profiel.`,
      ),
      muted(
        'Wij accepteren reviews van echte klanten. Reviews die marketing zijn, beledigend, of duidelijk vals worden niet geplaatst.',
      ),
    ].join(''),
  })

  const text = [
    `Uw review op ${companyName} is ontvangen`,
    '',
    'Bedankt voor uw review. Onze redactie controleert binnen 48 uur',
    'of de review aan onze richtlijnen voldoet en plaatst hem dan op',
    'het publieke profiel.',
    '',
    'Klushulpgids — klushulpgids.nl',
  ].join('\n')

  return { html, text }
}
