import 'server-only'

import { button, emailShell, emDashLabel, h1, linkFallback, muted, paragraph } from './shared'

export function magicLinkTemplate({ url }: { url: string }): { html: string; text: string } {
  const html = emailShell({
    preheader: 'Klik op de link om in te loggen bij Klushulpgids',
    body: [
      emDashLabel('Toegang'),
      h1('Inloggen bij Klushulpgids'),
      paragraph(
        'Klik op onderstaande knop om in te loggen op uw vakmensen-dashboard. Deze link is <strong>24 uur geldig</strong> en kan eenmalig worden gebruikt.',
      ),
      button(url, 'Inloggen'),
      linkFallback('Werkt de knop niet? Plak deze link in uw browser:', url),
      muted(
        'Heeft u dit verzoek niet zelf gedaan? Negeer deze e-mail — er gebeurt niets totdat de link wordt aangeklikt.',
      ),
    ].join(''),
  })

  const text = [
    'Inloggen bij Klushulpgids',
    '',
    'Klik op onderstaande link om in te loggen op uw vakmensen-dashboard.',
    'Deze link is 24 uur geldig en kan eenmalig worden gebruikt.',
    '',
    url,
    '',
    'Heeft u dit verzoek niet zelf gedaan? Negeer deze e-mail.',
    '',
    'Klushulpgids — klushulpgids.nl',
  ].join('\n')

  return { html, text }
}
