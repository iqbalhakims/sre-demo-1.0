import { useState, type KeyboardEvent } from 'react'

interface Props {
  onAdd: (content: string) => Promise<void>
}

export default function NoteForm({ onAdd }: Props) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    const trimmed = value.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      await onAdd(trimmed)
      setValue('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit()
  }

  return (
    <div style={styles.row}>
      <input
        style={styles.input}
        type="text"
        placeholder="Write a note..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={submitting}
      />
      <button style={styles.btn} onClick={submit} disabled={submitting || !value.trim()}>
        {submitting ? '...' : 'Add'}
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  row: { display: 'flex', gap: 8 },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: '0.95rem',
    outline: 'none',
  },
  btn: {
    padding: '10px 22px',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
}
