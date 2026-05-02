import 'server-only'

const BRAND_PRIMARY = '#B91C1C'
const BRAND_INK = '#1A1A1A'
const BRAND_PAPER = '#F7F3EC'
const BRAND_MUTED = '#6B6B6B'
const BRAND_RULE = '#1A1A1A'

/**
 * Editorial email-shell.
 *
 * **Responsive strategie:**
 * - Inline styles bepalen de desktop-versie (~600px). Outlook desktop honoreert
 *   alleen inline styles, dus die blijven leidend voor dat client.
 * - Een `<style>`-block in `<head>` met `@media (max-width: 480px)` queries
 *   verkleint padding/font-size en maakt knoppen full-width op iPhone, Apple
 *   Mail, Gmail mobile, en de meeste moderne clients (vrijwel alle behalve
 *   oudere Outlook-versies, die stylesheets strippen — daar zien gebruikers
 *   gewoon de desktop-versie).
 * - Tabel-layout (geen flexbox) voor maximale client-compatibiliteit.
 */
export function emailShell({ preheader, body }: { preheader: string; body: string }): string {
  // Preheader = de "preview text" in inbox-lijst (na subject). Verborgen in mail-body.
  const preheaderHidden = `<div style="display:none;visibility:hidden;mso-hide:all;font-size:1px;color:${BRAND_PAPER};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>`

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Klushulpgids</title>
  <style>
    /* Mobile overrides — gracefully ignored door Outlook desktop. */
    @media only screen and (max-width: 480px) {
      .em-outer-cell { padding: 20px 0 !important; }
      .em-card { width: 100% !important; }
      .em-header-cell { padding: 14px 18px !important; }
      .em-brand { font-size: 19px !important; }
      .em-tagline { display: block !important; margin-left: 0 !important; margin-top: 4px !important; }
      .em-body-cell { padding: 22px 18px !important; }
      .em-footer-cell { padding: 14px 18px !important; font-size: 12px !important; }
      .em-h1 { font-size: 24px !important; line-height: 1.18 !important; }
      .em-p { font-size: 16px !important; line-height: 1.5 !important; }
      .em-muted { font-size: 13px !important; }
      .em-em-dash { font-size: 11px !important; letter-spacing: 2px !important; }
      .em-btn-table { width: 100% !important; }
      .em-btn { display: block !important; padding: 16px 20px !important; text-align: center !important; }
    }
    /* Donkere clients (iOS dark mode etc.) — voorkom dat zwart op zwart wordt. */
    @media (prefers-color-scheme: dark) {
      .em-card { background: #fff !important; }
      .em-h1, .em-p { color: ${BRAND_INK} !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${BRAND_PAPER};color:${BRAND_INK};font-family:Georgia,'Times New Roman',serif;-webkit-font-smoothing:antialiased;">
  ${preheaderHidden}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND_PAPER};">
    <tr>
      <td align="center" class="em-outer-cell" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" class="em-card" style="background:#fff;border:1px solid ${BRAND_RULE};max-width:560px;width:100%;">
          <tr>
            <td class="em-header-cell" style="border-bottom:1px solid ${BRAND_RULE};padding:18px 28px;">
              <span class="em-brand" style="font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.3px;color:${BRAND_INK};">Klushulpgids</span>
              <span class="em-tagline" style="display:inline-block;margin-left:8px;font-family:Inter,Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:${BRAND_MUTED};">— Onafhankelijke gids</span>
            </td>
          </tr>
          <tr>
            <td class="em-body-cell" style="padding:32px 28px;">${body}</td>
          </tr>
          <tr>
            <td class="em-footer-cell" style="border-top:1px solid ${BRAND_RULE};padding:18px 28px;font-family:Inter,Arial,sans-serif;font-size:12px;color:${BRAND_MUTED};line-height:1.5;">
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
  return `<div class="em-em-dash" style="font-family:Inter,Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:${BRAND_PRIMARY};margin-bottom:12px;">— ${escapeHtml(text)}</div>`
}

export function h1(text: string): string {
  return `<h1 class="em-h1" style="font-family:Georgia,serif;font-size:30px;line-height:1.2;color:${BRAND_INK};margin:0 0 16px;font-weight:700;letter-spacing:-0.5px;">${escapeHtml(text)}</h1>`
}

export function paragraph(html: string): string {
  return `<p class="em-p" style="font-family:Georgia,serif;font-size:16px;line-height:1.55;color:${BRAND_INK};margin:0 0 16px;">${html}</p>`
}

export function muted(text: string): string {
  return `<p class="em-muted" style="font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.5;color:${BRAND_MUTED};margin:0 0 16px;">${escapeHtml(text)}</p>`
}

/**
 * Knop. Op desktop: inline-block, hugging-content. Op mobile: block + full-width
 * via media query (`em-btn` class).
 */
export function button(href: string, label: string): string {
  return `<table class="em-btn-table" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr><td style="background:${BRAND_INK};">
      <a class="em-btn" href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.4px;color:#fff;text-decoration:none;text-transform:uppercase;">${escapeHtml(label)}</a>
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
