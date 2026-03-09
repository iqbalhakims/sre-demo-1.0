import { useEffect, useState, useCallback } from 'react'
import { fetchNotes, createNote, deleteNote, fetchHealth } from './api'
import type { Note } from './types'
import NoteForm from './components/NoteForm'
import NoteList from './components/NoteList'
import HealthBadge from './components/HealthBadge'
import ArchInfo from './components/ArchInfo'

export default function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<{ status: string; db: string } | null>(null)

  const loadNotes = useCallback(async () => {
    try {
      setError(null)
      const data = await fetchNotes()
      setNotes(data)
    } catch {
      setError('Could not reach the backend API.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadHealth = useCallback(async () => {
    try {
      const h = await fetchHealth()
      setHealth(h)
    } catch {
      setHealth({ status: 'error', db: 'unreachable' })
    }
  }, [])

  useEffect(() => {
    loadNotes()
    loadHealth()
  }, [loadNotes, loadHealth])

  const handleAdd = async (content: string) => {
    await createNote(content)
    await loadNotes()
  }

  const handleDelete = async (id: number) => {
    await deleteNote(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Notes App</h1>
        <p style={styles.subtitle}>3-Tier Kubernetes POC</p>
        {health && <HealthBadge health={health} />}
      </div>

      <div style={styles.card}>
        <NoteForm onAdd={handleAdd} />
        {error && <p style={styles.error}>{error}</p>}
        <NoteList notes={notes} loading={loading} onDelete={handleDelete} />
      </div>

      <ArchInfo />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 16px',
    minHeight: '100vh',
    background: '#f0f2f5',
  },
  header: {
    textAlign: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.9rem',
    marginTop: 4,
    marginBottom: 10,
  },
  card: {
    background: 'white',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    padding: 24,
    width: '100%',
    maxWidth: 560,
    marginBottom: 24,
  },
  error: {
    color: '#dc2626',
    fontSize: '0.85rem',
    marginTop: 8,
  },
}
