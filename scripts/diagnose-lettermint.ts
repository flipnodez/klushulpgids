/**
 * Diagnostiek voor Lettermint integratie. Run via:
 *   scalingo --app klushulpgids run --detached -- npx tsx scripts/diagnose-lettermint.ts
 */

const KEY = process.env.LETTERMINT_API_KEY
const TO = 'info@zekerverduurzamen.nl'

async function tryEndpoint(url: string, headers: Record<string, string>) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        from: 'Klushulpgids <noreply@klushulpgids.nl>',
        to: TO,
        subject: '[diagnostic] Lettermint test',
        html: '<p>Test van Klushulpgids server.</p>',
        text: 'Test van Klushulpgids server.',
        reply_to: 'support@klushulpgids.nl',
      }),
    })
    const body = await res.text().catch(() => '<no body>')
    return { status: res.status, statusText: res.statusText, body: body.slice(0, 500) }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

async function main() {
  console.log('— LETTERMINT DIAGNOSE —')
  console.log('LETTERMINT_API_KEY set:', !!KEY)
  console.log('LETTERMINT_API_KEY length:', KEY?.length ?? 0)
  console.log('LETTERMINT_API_KEY prefix:', KEY ? KEY.slice(0, 6) + '…' : '<missing>')
  console.log('FROM_EMAIL:', process.env.FROM_EMAIL ?? '<unset>')

  if (!KEY) {
    console.error('✗ KEY ontbreekt — afbreken')
    process.exit(1)
  }

  const tests: Array<{ name: string; url: string; headers: Record<string, string> }> = [
    {
      name: 'POST /v1/email/send (Bearer)',
      url: 'https://api.lettermint.co/v1/email/send',
      headers: { Authorization: `Bearer ${KEY}` },
    },
    {
      name: 'POST /v1/send (Bearer)',
      url: 'https://api.lettermint.co/v1/send',
      headers: { Authorization: `Bearer ${KEY}` },
    },
    {
      name: 'POST /email/send (Bearer)',
      url: 'https://api.lettermint.co/email/send',
      headers: { Authorization: `Bearer ${KEY}` },
    },
    {
      name: 'POST /v1/email/send (X-API-Key)',
      url: 'https://api.lettermint.co/v1/email/send',
      headers: { 'X-API-Key': KEY },
    },
    {
      name: 'POST /v1/email/send (Token scheme)',
      url: 'https://api.lettermint.co/v1/email/send',
      headers: { Authorization: `Token ${KEY}` },
    },
  ]

  for (const t of tests) {
    console.log(`\n→ ${t.name}`)
    console.log(`   URL: ${t.url}`)
    const result = await tryEndpoint(t.url, t.headers)
    console.log('   result:', JSON.stringify(result))
  }

  console.log('\n— done —')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
