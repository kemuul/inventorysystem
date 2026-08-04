// config/db.js
// Central MySQL connection pool. Every controller imports { pool } from here
// instead of opening its own connection — pooling keeps the app fast and
// avoids "too many connections" errors under load.

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventorypro',
  waitForConnections: true,
  connectionLimit: 10,   // max simultaneous connections in the pool
  queueLimit: 0,
  decimalNumbers: true   // return DECIMAL columns as JS numbers, not strings
});

// Quick sanity check on boot so a bad .env fails loudly, not silently.
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected:', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
  }
}

module.exports = { pool, testConnection };
