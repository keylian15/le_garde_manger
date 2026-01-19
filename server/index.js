import "dotenv/config";
import express from "express";
import { healthCheck, pool } from "./db.js";
import swaggerUi from "swagger-ui-express";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const app = express();
app.use(express.json());

// Clé secrète pour signer les JWT (à mettre dans .env en production)
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-changez-moi-en-production'

// --- Swagger/OpenAPI docs (educational) ---
const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Garde-Manger API",
    version: "1.0.0",
    description: "API de démonstration avec vulnérabilités pédagogiques",
  },
  servers: [{ url: "http://localhost:" + (process.env.PORT || 5000) }],
  components: {
    securitySchemes: {
      basicAuth: { type: "http", scheme: "basic" },
      bearerAuth: { type: "http", scheme: "bearer" },
    },
    schemas: {
      Food: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          calories: { type: "integer", nullable: true },
          type: { type: "string", enum: ["aliment", "plat", "dessert", "boisson", "hippo"] },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          user: { type: "object", nullable: true },
          token: { type: "string", nullable: true },
          sql: { type: "string", nullable: true },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        summary: "Health check",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Login (vulnérable: u/p en query)",
        parameters: [
          { in: "query", name: "u", schema: { type: "string" } },
          { in: "query", name: "p", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Login result", content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } } },
        },
      },
    },
    "/api/foods": {
      get: {
        summary: "Lister les aliments",
        security: [{ basicAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { in: "query", name: "q", schema: { type: "string" } },
          { in: "query", name: "type", schema: { type: "string" } },
          { in: "query", name: "raw", schema: { type: "string" }, description: "1 pour mode vulnérable (concat SQL)" },
        ],
        responses: { "200": { description: "Liste", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Food" } } } } } },
      },
      post: {
        summary: "Créer un aliment",
        security: [{ basicAuth: [] }, { bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Food" } } } },
        responses: { "201": { description: "Créé", content: { "application/json": { schema: { $ref: "#/components/schemas/Food" } } } } },
      },
    },
    "/api/foods/{id}": {
      put: {
        summary: "Modifier un aliment",
        security: [{ basicAuth: [] }, { bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Food" } } } },
        responses: { "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/Food" } } } } },
      },
      delete: {
        summary: "Supprimer un aliment",
        security: [{ basicAuth: [] }, { bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
        responses: { "204": { description: "Supprimé" } },
      },
    },
    "/api/debug/users": {
      get: {
        summary: "Lister tous les utilisateurs avec mot de passe (haché)",
        responses: { "200": { description: "Liste d'utilisateurs" } },
      },
    },
  },
};

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.get("/api/openapi.json", (req, res) => res.json(openapi));

// Basic Auth middleware: expects Authorization: Basic base64(email:password)
async function basicAuth(req, res, next) {
  try {
    const h = req.headers['authorization'] || ''
    // Valider le Bearer token avec JWT
    if (h.startsWith('Bearer ')) {
      const token = h.slice(7)
      try {
        // Vérifier et décoder le JWT
        const decoded = jwt.verify(token, JWT_SECRET)
        
        // Vérifier que le payload contient un userId
        if (!decoded.userId) {
          return res.status(401).json({ error: 'invalid_token' })
        }
        
        req.user = { id: decoded.userId }
        return next()
      } catch (e) {
        if (e.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'token_expired' })
        }
        return res.status(401).json({ error: 'invalid_token' })
      }
    }
    if (!h.startsWith('Basic ')) return res.status(401).json({ error: 'auth_required' })
    const decoded = Buffer.from(h.slice(6), 'base64').toString('utf8')
    const idx = decoded.indexOf(':')
    if (idx === -1) return res.status(401).json({ error: 'invalid_auth_header' })
    const email = decoded.slice(0, idx)
    const password = decoded.slice(idx + 1)
    if (!email || !password) return res.status(401).json({ error: 'invalid_credentials' })
    const [rows] = await pool.query(
      'SELECT id, email, password FROM users WHERE email = ? LIMIT 1',
      [email]
    )
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'invalid_credentials' })
    
    // Vérification sécurisée du mot de passe avec bcrypt
    const isValid = await bcrypt.compare(password, rows[0].password)
    if (!isValid) return res.status(401).json({ error: 'invalid_credentials' })
    
    req.user = { id: rows[0].id, email: rows[0].email }
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

// INSECURE: Expose users with hashed passwords (for educational purposes)
app.get('/api/debug/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, password, created_at FROM users ORDER BY id')
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Route d'inscription
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Champs requis' })
    }

    // Vérifier si l'utilisateur existe déjà
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' })
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    await pool.query(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    )

    res.status(201).json({ ok: true, message: 'Utilisateur créé' })
  } catch (e) {
    res.status(500).json({ error: 'internal_server_error' })
  }
})

// Simple login endpoint (intentionally vulnerable for exercise)
app.post('/api/auth/login', async (req, res) => {
  try {
    // L'email = u et le password = p 
    const { u, p } = req.query

    if (!u || !p) {
      return res.status(400).json({ error: 'Champs requis' })
    }

    // Requête préparée (anti SQL injection)
    const [rows] = await pool.query(
      'SELECT id, email, password FROM users WHERE email = ? LIMIT 1',
      [u]
    )

    

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' })
    }

    const user = rows[0]
    
    // Vérification du mot de passe
    const isValid = await bcrypt.compare(p, user.password)

    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants invalides' })
    }

    // Générer un JWT signé
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      ok: true,
      user: { id: user.id, email: user.email },
      token
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'internal_server_error' })
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

// Create a new food item
app.post('/api/foods', basicAuth, async (req, res) => {
  try {
    const { name, description, calories, type } = req.body || {}
    const allowedTypes = new Set(['aliment', 'plat', 'dessert', 'boisson', 'hippo'])
    if (!name || !type || !allowedTypes.has((type || '').toString())) {
      return res.status(400).json({ error: 'invalid_payload' })
    }
    const cal = calories == null || calories === '' ? null : Number(calories)
    const sql = 'INSERT INTO foods (name, description, calories, type) VALUES (?, ?, ?, ?)'
    const params = [name.toString(), description || null, cal != null && !Number.isNaN(cal) ? cal : null, type.toString()]
    const [result] = await pool.query(sql, params)
    const [rows] = await pool.query('SELECT id, name, description, calories, type FROM foods WHERE id = ?', [result.insertId])
    res.status(201).json(rows && rows[0] ? rows[0] : { id: result.insertId, name, description: description || null, calories: cal, type })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Update an existing food item
app.put('/api/foods/:id', basicAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid_id' })
    const { name, description, calories, type } = req.body || {}
    const allowedTypes = new Set(['aliment', 'plat', 'dessert', 'boisson', 'hippo'])
    if (!name || !type || !allowedTypes.has((type || '').toString())) {
      return res.status(400).json({ error: 'invalid_payload' })
    }
    const cal = calories == null || calories === '' ? null : Number(calories)
    const sql = 'UPDATE foods SET name = ?, description = ?, calories = ?, type = ? WHERE id = ?'
    const params = [name.toString(), description || null, cal != null && !Number.isNaN(cal) ? cal : null, type.toString(), id]
    const [result] = await pool.query(sql, params)
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not_found' })
    const [rows] = await pool.query('SELECT id, name, description, calories, type FROM foods WHERE id = ?', [id])
    res.json(rows && rows[0] ? rows[0] : { id, name, description: description || null, calories: cal, type })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Delete a food item
app.delete('/api/foods/:id', basicAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'invalid_id' })
    const [result] = await pool.query('DELETE FROM foods WHERE id = ?', [id])
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not_found' })
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
});
