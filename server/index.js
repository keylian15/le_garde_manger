import 'dotenv/config'
import express from 'express'
import { healthCheck, pool } from './db.js'

const app = express()
app.use(express.json())

app.get('/api/health', async (req, res) => {
  try {
    const ok = await healthCheck()
    res.json({ ok, db: ok ? 'up' : 'down' })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// Example: list tables (optional diagnostic)
app.get('/api/_tables', async (req, res) => {
  try {
    const [rows] = await pool.query('SHOW TABLES')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const PORT = Number(process.env.PORT || 5000)
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})
