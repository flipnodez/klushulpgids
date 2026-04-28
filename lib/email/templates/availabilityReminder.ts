import 'server-only'

import { button, emailShell, emDashLabel, h1, muted, paragraph } from './shared'

export function availabilityReminderTemplate({
  companyName,
  daysSinceUpdate,
  dashboardUrl,
}: {
  companyName: string
  daysSinceUpdate: number
  dashboardUrl: string
}): { html: string; text: string } {
  const html = emailShell({
    preheader: `Uw beschikbaarheid is ${daysSinceUpdate} dagen oud`,
    body: [
      emDashLabel('Reminder'),
      h1('Uw beschikbaarheid is verouderd'),
      paragraph(
        `De beschikbaarheidsstatus van <strong>${companyName}</strong> is voor het laatst <strong>${daysSinceUpdate} dagen</strong> geleden bijgewerkt. Klanten kiezen vaker voor profielen met een actuele status.`,
      ),
      button(dashboardUrl, 'Status bijwerken'),
      muted(
        'Geen reminders meer ontvangen? U kunt deze uitzetten via Instellingen in uw dashboard.',
      ),
    ].join(''),
  })

  const text = [
    `Uw beschikbaarheid is verouderd`,
    '',
    `De beschikbaarheid van ${companyName} is voor het laatst ${daysSinceUpdate} dagen`,
    'geleden bijgewerkt. Klanten kiezen vaker voor profielen met een actuele status.',
    '',
    'Status bijwerken:',
    dashboardUrl,
    '',
    'Klushulpgids — klushulpgids.nl',
  ].join('\n')

  return { html, text }
}
