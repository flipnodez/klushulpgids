import styles from '../shared.module.css'

export const metadata = { title: 'Import' }

export default function ImportStubPage() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Admin · Import</p>
        <h1 className={styles.h1}>CSV / JSON import</h1>
        <p className={styles.lede}>Volgt in Sprint 3 van Phase 7.</p>
      </header>
      <div className={styles.empty}>
        Bulk-import via CSV/JSON met kolom-mapping en Zod-validatie. In de tussentijd kan import via{' '}
        <code style={{ fontSize: 13 }}>scripts/import-sample-data.ts</code> +{' '}
        <code style={{ fontSize: 13 }}>scripts/update-records.ts</code>.
      </div>
    </div>
  )
}
