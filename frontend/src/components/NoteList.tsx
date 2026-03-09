import type { Note } from '../types'

interface Props {
  notes: Note[]
  loading: boolean
  onDelete: (id: number) => Promise<void>
}

export default function NoteList({ notes, loading, onDelete }: Props) {
  if (loading) {
    return <p style={styles.empty}>Loading notes...</p>
  }

  if (!notes.length) {
    return <p style={styles.empty}>No notes yet. Add one above.</p>
  }

  return (
    <ul style={styles.list}>
      {notes.map(note => (
        <li key={note.id} style={styles.item}>
          <div>
            <div style={styles.content}>{note.content}</div>
            <div style={styles.time}>{new Date(note.created_at).toLocaleString()}</div>
          </div>
          <button style={styles.deleteBtn} onClick={() => onDelete(note.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}

const styles: Record<string, React.CSSProperties> = {
  list: {
    listStyle: 'none',
    marginTop: 20,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  content: {
    color: '#374151',
    fontSize: '0.95rem',
  },
  time: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    padding: '24px 0',
    marginTop: 16,
  },
  deleteBtn: {
    padding: '6px 12px',
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
}
