import type { Note } from './types'

const BASE = '/api'

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${BASE}/notes`)
  if (!res.ok) throw new Error('Failed to fetch notes')
  return res.json()
}

export async function createNote(content: string): Promise<Note> {
  const res = await fetch(`${BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error('Failed to create note')
  return res.json()
}

export async function deleteNote(id: number): Promise<void> {
  const res = await fetch(`${BASE}/notes/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete note')
}

export async function fetchHealth(): Promise<{ status: string; db: string }> {
  const res = await fetch(`${BASE}/health`)
  if (!res.ok) throw new Error('Health check failed')
  return res.json()
}
