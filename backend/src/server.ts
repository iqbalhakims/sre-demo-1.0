import express, { Request, Response } from 'express'
import cors from 'cors'
import { Pool } from 'pg'

const app = express()
const port = parseInt(process.env.PORT ?? '3000', 10)

app.use(cors())
app.use(express.json())

// ------- Database -------
const pool = new Pool({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME     ?? 'notesdb',
  user:     process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
})

async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id         SERIAL PRIMARY KEY,
      content    TEXT        NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

// ------- Routes -------
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'ok' })
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable' })
  }
})

app.get('/api/notes', async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM notes ORDER BY created_at DESC')
  res.json(result.rows)
})

app.post('/api/notes', async (req: Request, res: Response) => {
  const { content } = req.body as { content?: string }
  if (!content?.trim()) {
    res.status(400).json({ error: 'content is required' })
    return
  }
  const result = await pool.query(
    'INSERT INTO notes (content) VALUES ($1) RETURNING *',
    [content.trim()]
  )
  res.status(201).json(result.rows[0])
})

app.delete('/api/notes/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    res.status(400).json({ error: 'invalid id' })
    return
  }
  await pool.query('DELETE FROM notes WHERE id = $1', [id])
  res.status(204).send()
})

// ------- Start -------
initDb()
  .then(() => {
    app.listen(port, () => console.log(`Backend listening on :${port}`))
  })
  .catch(err => {
    console.error('DB init failed:', err)
    process.exit(1)
  })
