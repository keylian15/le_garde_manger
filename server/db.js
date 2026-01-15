import 'dotenv/config'
import mysql from 'mysql2/promise'

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_NAME = 'garde_manger',
  DB_USER = 'admin',
  DB_PASS = '1234',
  DB_SSL = 'false',
  DB_SSL_CA,
} = process.env

let ssl
if (DB_SSL.toLowerCase() === 'true') {
  ssl = DB_SSL_CA ? { ca: DB_SSL_CA } : {}
}

export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(ssl ? { ssl } : {}),
})

export async function healthCheck() {
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query('SELECT 1 AS ok')
    return rows && rows[0] && rows[0].ok === 1
  } finally {
    conn.release()
  }
}
