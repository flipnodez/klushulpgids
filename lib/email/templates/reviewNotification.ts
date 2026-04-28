import 'server-only'

import { button, emailShell, emDashLabel, h1, muted, paragraph, escapeHtml } from './shared'

export function reviewNotificationTemplate({
  companyName,
  reviewerName,
  rating,
  excerpt,
  dashboardUrl,
}: {
  companyName: string
  reviewerName: string
  rating: number
  excerpt: string
  dashboardUrl: string
}): { html: string; text: string } {
  const stars = '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating))

  const html = emailShell({
    preheader: `Nieuwe ${rating}-sterren-review op ${companyName}`,
    body: [
      emDashLabel('Nieuwe review'),
      h1('Een klant heeft uw werk beoordeeld'),
      paragraph(
        `<strong>${escapeHtml(reviewerName)}</strong> heeft een review achtergelaten voor <strong>${escapeHtml(companyName)}</strong>:`,
      ),
      `<div style="border-left:3px solid #B91C1C;padding:12px 16px;margin:0 0 16px;background:#F7F3EC;font-family:Georgia,serif;font-size:15px;color:#1A1A1A;">
        <div style="font-size:18px;color:#B91C1C;letter-spacing:2px;margin-bottom:6px;">${stars}</div>
        <em>"${escapeHtml(excerpt)}"</em>
      </div>`,
      button(dashboardUrl, 'Bekijken & reageren'),
      muted(
        'U kunt een publieke reactie achterlaten via uw dashboard. Reacties zijn zichtbaar onder de review op uw profiel.',
      ),
    ].join(''),
  })

  const text = [
    `Nieuwe review op ${companyName}`,
    '',
    `${reviewerName} (${rating}/5 sterren) schrijft:`,
    `"${excerpt}"`,
    '',
    'Bekijken & reageren:',
    dashboardUrl,
    '',
    'Klushulpgids — klushulpgids.nl',
  ].join('\n')

  return { html, text }
}
