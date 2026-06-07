import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
});

export async function testConnection() {
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

export async function closePool() {
  await pool.end();
}
