interface Props {
  health: { status: string; db: string }
}

export default function HealthBadge({ health }: Props) {
  const ok = health.status === 'ok' && health.db === 'ok'
  return (
    <div style={{ ...styles.badge, background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#15803d' : '#dc2626' }}>
      {ok ? 'All tiers healthy' : `Degraded — DB: ${health.db}`}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  badge: {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: 20,
    fontSize: '0.78rem',
    fontWeight: 600,
    marginTop: 6,
  },
}
