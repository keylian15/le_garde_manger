import "dotenv/config";
import express from "express";
import { healthCheck, pool } from "./db.js";
import swaggerUi from "swagger-ui-express";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { sendPasswordResetEmail } from './email.js'
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

// Route pour demander la réinitialisation du mot de passe
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email requis' })
    }

    // Vérifier si l'utilisateur existe
    const [users] = await pool.query(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    )

    // Pour des raisons de sécurité, on renvoie toujours un message de succès
    // même si l'email n'existe pas (pour ne pas révéler quels emails sont enregistrés)
    if (users.length === 0) {
      return res.json({ 
        ok: true, 
        message: 'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.' 
      })
    }

    const user = users[0]

    // Générer un token de réinitialisation sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    
    // Le token expire dans 1 heure
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    // Supprimer les anciens tokens de réinitialisation pour cet utilisateur
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = ?',
      [user.id]
    )

    // Insérer le nouveau token
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, hashedToken, expiresAt]
    )

    // Créer l'URL de réinitialisation pointant vers le frontend
    // Utilise l'origine de la requête pour supporter n'importe quel port
    const frontendOrigin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'http://localhost:5173'
    const resetUrl = `${frontendOrigin}/reset-password/${resetToken}`

    // Envoyer l'email
    const emailResult = await sendPasswordResetEmail(user.email, resetUrl)

    if (!emailResult.success) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailResult.error)
      // On ne révèle pas l'erreur à l'utilisateur pour des raisons de sécurité
    }

    res.json({ 
      ok: true, 
      message: 'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.' 
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'internal_server_error' })
  }
})

// Route pour réinitialiser le mot de passe avec le token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis' })
    }

    // Valider le mot de passe (minimum 6 caractères)
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' })
    }

    // Hasher le token reçu pour le comparer à celui en base
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Récupérer le token de réinitialisation
    const [tokens] = await pool.query(
      `SELECT rt.id, rt.user_id, rt.expires_at, u.email 
       FROM password_reset_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = ?`,
      [hashedToken]
    )

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'Token invalide ou expiré' })
    }

    const tokenData = tokens[0]

    // Vérifier si le token n'est pas expiré
    if (new Date() > new Date(tokenData.expires_at)) {
      // Supprimer le token expiré
      await pool.query('DELETE FROM password_reset_tokens WHERE id = ?', [tokenData.id])
      return res.status(400).json({ error: 'Token expiré' })
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe de l'utilisateur
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, tokenData.user_id]
    )

    // Supprimer le token utilisé
    await pool.query('DELETE FROM password_reset_tokens WHERE id = ?', [tokenData.id])

    res.json({ 
      ok: true, 
      message: 'Mot de passe réinitialisé avec succès' 
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
