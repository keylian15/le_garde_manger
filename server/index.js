import "dotenv/config";
import express from "express";
import { healthCheck, pool } from "./db.js";

const app = express();
app.use(express.json());

// Basic Auth middleware: expects Authorization: Basic base64(email:password)
async function basicAuth(req, res, next) {
  try {
    const h = req.headers['authorization'] || ''
    if (!h.startsWith('Basic ')) return res.status(401).json({ error: 'auth_required' })
    const decoded = Buffer.from(h.slice(6), 'base64').toString('utf8')
    const idx = decoded.indexOf(':')
    if (idx === -1) return res.status(401).json({ error: 'invalid_auth_header' })
    const email = decoded.slice(0, idx)
    const password = decoded.slice(idx + 1)
    if (!email || !password) return res.status(401).json({ error: 'invalid_credentials' })
    const [rows] = await pool.query(
      'SELECT id, email FROM users WHERE email = ? AND password = SHA2(?, 256) LIMIT 1',
      [email, password]
    )
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'invalid_credentials' })
    req.user = rows[0]
    return next()
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

app.get("/api/health", async (req, res) => {
    try {
        const ok = await healthCheck();
        res.json({ ok, db: ok ? "up" : "down" });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// Example: list tables (optional diagnostic)
app.get("/api/_tables", async (req, res) => {
    try {
        const [rows] = await pool.query("SHOW TABLES");
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Route d'inscription
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Champs requis' });

    // Vérifier si l'utilisateur existe déjà
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Insertion avec hachage SHA2 256 pour correspondre à votre logique de login
    await pool.query(
      'INSERT INTO users (email, password) VALUES (?, SHA2(?, 256))',
      [email, password]
    );

    res.status(201).json({ ok: true, message: 'Utilisateur créé' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Simple login endpoint to validate credentials (no session)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' })
    const [rows] = await pool.query(
      'SELECT id, email FROM users WHERE email = ? AND password = SHA2(?, 256) LIMIT 1',
      [email, password]
    )
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'invalid_credentials' })
    res.json({ ok: true, user: rows[0] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Foods listing with optional text filter `q` on name/description
app.get("/api/foods", basicAuth, async (req, res) => {
    const q = (req.query.q || "").toString().trim();
    const type = (req.query.type || "").toString().trim();
    const allowedTypes = new Set([
        "aliment",
        "plat",
        "dessert",
        "boisson",
        "hippo",
    ]);
    try {
        let sql = "SELECT id, name, description, calories, type FROM foods";
        const where = [];
        const params = [];
        if (q) {
            where.push("(name LIKE ? OR description LIKE ?)");
            params.push(`%${q}%`, `%${q}%`);
        }
        if (type && allowedTypes.has(type)) {
            where.push("type = ?");
            params.push(type);
        }
        if (where.length) {
            sql += " WHERE " + where.join(" AND ");
        }
        sql += " ORDER BY name LIMIT 200";
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
});
