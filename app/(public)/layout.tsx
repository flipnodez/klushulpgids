import type { ReactNode } from 'react'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Stamp } from '@/components/ui/Stamp'

import styles from './layout.module.css'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Direct naar inhoud
      </a>
      <Header />
      <main id="main" className={styles.main}>
        {children}
      </main>
      <Footer
        stamps={
          <>
            <Stamp>✓ Onafhankelijk</Stamp>
            <Stamp>◆ KvK-geverifieerd</Stamp>
          </>
        }
        legal={
          <span>
            Wij gebruiken alleen functionele cookies en privacy-vriendelijke bezoekersstatistieken
            (Plausible). Geen tracking.
          </span>
        }
      />
    </>
  )
}
