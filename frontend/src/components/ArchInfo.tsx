const tiers = [
  { label: 'Tier 1', desc: 'Frontend — Nginx serving React/TS build', color: '#dbeafe', text: '#1d4ed8' },
  { label: 'Tier 2', desc: 'Backend — Node.js Express REST API (TS)', color: '#dcfce7', text: '#15803d' },
  { label: 'Tier 3', desc: 'Database — PostgreSQL StatefulSet', color: '#fef9c3', text: '#a16207' },
]

export default function ArchInfo() {
  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>Architecture</h3>
      {tiers.map(t => (
        <div key={t.label} style={styles.row}>
          <span style={{ ...styles.badge, background: t.color, color: t.text }}>{t.label}</span>
          <span style={styles.desc}>{t.desc}</span>
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'white',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    padding: '20px 24px',
    width: '100%',
    maxWidth: 560,
  },
  heading: {
    fontSize: '0.9rem',
    fontWeight: 700,
    marginBottom: 12,
    color: '#1a1a2e',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  badge: {
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: '0.75rem',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  desc: {
    fontSize: '0.85rem',
    color: '#4b5563',
  },
}
