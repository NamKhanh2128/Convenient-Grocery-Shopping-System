const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
});

async function query(text, params) {
  return pool.query(text, params);
}

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query('SELECT current_database() AS database_name, inet_server_addr() AS host');
    return {
      connected: true,
      database: rows[0].database_name,
      host: rows[0].host,
    };
  } finally {
    client.release();
  }
}

async function closePool() {
  await pool.end();
}

module.exports = {
  closePool,
  pool,
  query,
  testConnection,
};
