/**
 * Lettermint test-send. Run via:
 *   scalingo --app klushulpgids run --detached -- npx tsx scripts/diagnose-lettermint.ts
 *
 * Stuurt een echte test-mail naar info@zekerverduurzamen.nl met de juiste
 * endpoint + headers + body shape (zie lettermint-go SDK).
 */

const KEY = process.env.LETTERMINT_API_KEY
const TO = 'info@zekerverduurzamen.nl'

async function main() {
  if (!KEY) {
    console.error('✗ LETTERMINT_API_KEY ontbreekt')
    process.exit(1)
  }
  console.log('LETTERMINT_API_KEY prefix:', KEY.slice(0, 6) + '…', `(len=${KEY.length})`)

  const url = 'https://api.lettermint.co/v1/send'
  console.log(`\n→ POST ${url}`)
  console.log('   header: X-Lettermint-Token')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Lettermint-Token': KEY,
    },
    body: JSON.stringify({
      from: 'Klushulpgids <noreply@klushulpgids.nl>',
      to: [TO],
      subject: '[diagnostic] Lettermint test van Klushulpgids',
      html: '<p>Dit is een diagnostische test. Als u dit ontvangt werkt de Lettermint integratie.</p>',
      text: 'Dit is een diagnostische test. Als u dit ontvangt werkt de Lettermint integratie.',
      reply_to: ['support@klushulpgids.nl'],
    }),
  })

  const body = await res.text().catch(() => '<no body>')
  console.log(`   status: ${res.status} ${res.statusText}`)
  console.log(`   body:   ${body.slice(0, 600)}`)

  if (res.ok) {
    console.log('\n✓ Mail verstuurd naar', TO)
  } else {
    console.log('\n✗ Mail NIET verstuurd')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
