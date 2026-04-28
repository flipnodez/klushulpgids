/**
 * Diagnostiek voor Lettermint integratie. Run via:
 *   scalingo --app klushulpgids run --detached -- npx tsx scripts/diagnose-lettermint.ts
 *
 * Logt (zonder secret te lekken):
 *   - Of LETTERMINT_API_KEY is gezet en lengte
 *   - HTTP-response van een echte test-mail naar info@zekerverduurzamen.nl
 */

export {}

const KEY = process.env.LETTERMINT_API_KEY
const TO = 'info@zekerverduurzamen.nl'

console.log('— LETTERMINT DIAGNOSE —')
console.log('LETTERMINT_API_KEY set:', !!KEY)
console.log('LETTERMINT_API_KEY length:', KEY?.length ?? 0)
console.log('LETTERMINT_API_KEY prefix:', KEY ? KEY.slice(0, 6) + '…' : '<missing>')
console.log('FROM_EMAIL:', process.env.FROM_EMAIL ?? '<unset>')
console.log()

if (!KEY) {
  console.error('✗ KEY ontbreekt — afbreken')
  process.exit(1)
}

const endpoints = [
  'https://api.lettermint.co/v1/email/send',
  'https://api.lettermint.co/email/send',
  'https://api.lettermint.co/v1/send',
  'https://api.lettermint.co/send',
]

for (const url of endpoints) {
  console.log(`\n→ POST ${url}`)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        from: 'Klushulpgids <noreply@klushulpgids.nl>',
        to: TO,
        subject: '[diagnostic] Lettermint test',
        html: '<p>Dit is een test van de Klushulpgids server.</p>',
        text: 'Dit is een test van de Klushulpgids server.',
        reply_to: 'support@klushulpgids.nl',
      }),
    })
    const body = await res.text().catch(() => '<no body>')
    console.log(`   status: ${res.status} ${res.statusText}`)
    console.log(`   body:   ${body.slice(0, 400)}`)
    if (res.ok) {
      console.log('✓ Deze endpoint accepteerde de request — gebruik deze')
      break
    }
  } catch (err) {
    console.log(`   FETCH ERROR: ${(err as Error).message}`)
  }
}

console.log('\n— Test ook met X-API-Key header (sommige providers gebruiken dat) —')
try {
  const res = await fetch('https://api.lettermint.co/v1/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': KEY,
    },
    body: JSON.stringify({
      from: 'Klushulpgids <noreply@klushulpgids.nl>',
      to: TO,
      subject: '[diagnostic] Lettermint test (X-API-Key)',
      html: '<p>Test 2.</p>',
      text: 'Test 2.',
    }),
  })
  const body = await res.text().catch(() => '<no body>')
  console.log(`   status: ${res.status}`)
  console.log(`   body:   ${body.slice(0, 400)}`)
} catch (err) {
  console.log(`   FETCH ERROR: ${(err as Error).message}`)
}

console.log('\n— done —')
