import { Container } from '@/components/ui/Container'
import { EmDashLabel } from '@/components/ui/EmDashLabel'

export default function Loading() {
  return (
    <Container>
      <div
        style={{
          minHeight: '40vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 'var(--sp-3)',
          maxWidth: 600,
          padding: 'var(--sp-12) 0',
        }}
      >
        <EmDashLabel variant="muted">Een ogenblik geduld</EmDashLabel>
        <p
          className="serif"
          style={{
            fontSize: 'var(--fs-lead)',
            color: 'var(--muted)',
            fontStyle: 'italic',
          }}
        >
          De gids wordt geladen…
        </p>
      </div>
    </Container>
  )
}
