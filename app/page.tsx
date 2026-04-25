import styles from './page.module.css'

const ISSUE_DATE = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

export default function HomePage() {
  return (
    <main id="main" className={styles.main}>
      <header className={styles.masthead}>
        <p className={`label label-muted ${styles.dateline}`}>
          <span aria-hidden="true">────</span> {ISSUE_DATE}
        </p>
        <hr className="rule-thick" />
      </header>

      <section className={styles.hero}>
        <p className={`label label-accent ${styles.kicker}`}>
          <span aria-hidden="true">────</span> In ontwikkeling
        </p>
        <h1 className={styles.title}>
          Klushulpgids<span className={styles.italicWord}>.nl</span>
        </h1>
        <p className={styles.lede}>
          De onafhankelijke gids voor Nederlandse vakmannen — een editorial naslagwerk in opbouw.
        </p>
      </section>

      <hr className="rule-soft" />

      <footer className={styles.colophon}>
        <p className="label label-muted">
          <span aria-hidden="true">────</span> Deel I &middot; Fundering
        </p>
      </footer>
    </main>
  )
}
