import styles from '../shared.module.css'

export const metadata = { title: 'Blog' }

export default function BlogStubPage() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Admin · Blog</p>
        <h1 className={styles.h1}>Blog CMS</h1>
        <p className={styles.lede}>Volgt in Sprint 3 van Phase 7.</p>
      </header>
      <div className={styles.empty}>
        Blog-CMS (markdown editor + cover-image + FAQ/HowTo repeaters + publish-flow) wordt
        binnenkort opgeleverd.
      </div>
    </div>
  )
}
