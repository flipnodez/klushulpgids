import 'server-only'

const BRAND_PRIMARY = '#B91C1C'
const BRAND_INK = '#1A1A1A'
const BRAND_PAPER = '#F7F3EC'
const BRAND_MUTED = '#6B6B6B'
const BRAND_RULE = '#1A1A1A'

/**
 * Editorial email-shell. Inline-styled (geen `<style>`-tags want
 * Outlook strips die). Zoveel mogelijk text-table layouts; geen flexbox.
 */
export function emailShell({ preheader, body }: { preheader: string; body: string }): string {
  // Preheader = de "preview text" in inbox-lijst (na subject). Verborgen in mail-body.
  const preheaderHidden = `<div style="display:none;visibility:hidden;mso-hide:all;font-size:1px;color:${BRAND_PAPER};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>`

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Klushulpgids</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_PAPER};color:${BRAND_INK};font-family:Georgia,'Times New Roman',serif;">
  ${preheaderHidden}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND_PAPER};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border:1px solid ${BRAND_RULE};max-width:100%;">
          <tr>
            <td style="border-bottom:1px solid ${BRAND_RULE};padding:18px 28px;">
              <span style="font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:${BRAND_INK};">Klushulpgids</span>
              <span style="display:inline-block;margin-left:8px;font-family:Inter,Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_MUTED};">— Onafhankelijke gids</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">${body}</td>
          </tr>
          <tr>
            <td style="border-top:1px solid ${BRAND_RULE};padding:18px 28px;font-family:Inter,Arial,sans-serif;font-size:12px;color:${BRAND_MUTED};line-height:1.5;">
              U ontvangt deze e-mail omdat u of uw bedrijf is opgenomen in de
              Klushulpgids. Geen interesse?
              <a href="https://klushulpgids.nl/voor-vakmensen/uitschrijven" style="color:${BRAND_PRIMARY};text-decoration:underline;">Verwijder mijn profiel</a>.<br>
              Klushulpgids · klushulpgids.nl · <a href="mailto:support@klushulpgids.nl" style="color:${BRAND_PRIMARY};text-decoration:underline;">support@klushulpgids.nl</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function emDashLabel(text: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:${BRAND_PRIMARY};margin-bottom:12px;">— ${escapeHtml(text)}</div>`
}

export function h1(text: string): string {
  return `<h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.2;color:${BRAND_INK};margin:0 0 16px;font-weight:700;letter-spacing:-0.5px;">${escapeHtml(text)}</h1>`
}

export function paragraph(html: string): string {
  return `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.55;color:${BRAND_INK};margin:0 0 16px;">${html}</p>`
}

export function muted(text: string): string {
  return `<p style="font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.5;color:${BRAND_MUTED};margin:0 0 16px;">${escapeHtml(text)}</p>`
}

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr><td style="background:${BRAND_INK};">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.4px;color:#fff;text-decoration:none;text-transform:uppercase;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
