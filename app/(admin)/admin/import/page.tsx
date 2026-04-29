import Link from 'next/link'

import { ImportForm } from './ImportForm'
import styles from '../shared.module.css'

export const metadata = { title: 'Import' }
export const dynamic = 'force-dynamic'

export default function ImportPage() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Admin · Import</p>
        <h1 className={styles.h1}>Bulk-import vakmensen</h1>
        <p className={styles.lede}>
          Upload een JSON-bestand met records die voldoen aan het{' '}
          <Link href="#schema">verwachte schema</Link>. Records worden <strong>upserted</strong> op
          KvK-nummer, blacklist-entries worden geskipt.
        </p>
      </header>

      <ImportForm />

      <section id="schema" className={styles.section}>
        <h2 className={styles.h2} style={{ fontSize: 18, marginBottom: 12 }}>
          Verwacht JSON-schema
        </h2>
        <p style={{ fontSize: 13, marginBottom: 12 }}>
          Het bestand moet een <code>array</code> zijn van objecten met deze velden (alle velden
          behalve <code>companyName</code>, <code>kvkNumber</code> en <code>citySlug</code> zijn
          optioneel):
        </p>
        <pre
          style={{
            background: '#fff',
            border: '1px solid var(--rule)',
            padding: 16,
            fontSize: 12,
            overflow: 'auto',
          }}
        >
          {`[
  {
    "companyName": "Voorbeeld B.V.",
    "kvkNumber": "12345678",
    "slug": "voorbeeld-bv-amsterdam",
    "citySlug": "amsterdam",
    "tradeSlug": "loodgieters",
    "email": "info@voorbeeld.nl",
    "phone": "020 123 4567",
    "websiteUrl": "https://voorbeeld.nl",
    "description": "Korte beschrijving…",
    "hourlyRateMin": 65,
    "hourlyRateMax": 95,
    "qualityScore": 70,
    "specialties": ["badkamer", "cv-installatie"]
  }
]`}
        </pre>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
          Voor grote imports (&gt; 1000 records) is het verstandiger het bestaande script te
          draaien:{' '}
          <code style={{ fontSize: 11 }}>
            scalingo run -- npx tsx scripts/import-sample-data.ts
          </code>
          . Dit form is bedoeld voor kleine batches en ad-hoc updates.
        </p>
      </section>
    </div>
  )
}
