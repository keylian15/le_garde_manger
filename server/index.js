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

// Foods listing with optional text filter `q` on name/description
app.get('/api/foods', async (req, res) => {
  const q = (req.query.q || '').toString().trim()
  const type = (req.query.type || '').toString().trim()
  const allowedTypes = new Set(['aliment', 'plat', 'dessert', 'boisson', 'autre'])
  try {
    let sql = 'SELECT id, name, description, calories, type FROM foods'
    const where = []
    const params = []
    if (q) {
      where.push('(name LIKE ? OR description LIKE ?)')
      params.push(`%${q}%`, `%${q}%`)
    }
    if (type && allowedTypes.has(type)) {
      where.push('type = ?')
      params.push(type)
    }
    if (where.length) {
      sql += ' WHERE ' + where.join(' AND ')
    }
    sql += ' ORDER BY name LIMIT 200'
    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const PORT = Number(process.env.PORT || 5000)
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})
