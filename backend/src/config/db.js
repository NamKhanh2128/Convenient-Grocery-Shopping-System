const dns = require('dns');
const { Pool } = require('pg');

// Ưu tiên IPv4 khi host có cả A và AAAA (tránh ENOTFOUND trên mạng không IPv6)
dns.setDefaultResultOrder('ipv4first');

let pool = null;
function buildPoolConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false'
        ? false
        : { rejectUnauthorized: false },
      max: Number(process.env.DB_POOL_MAX) || 10,
    };
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'false'
      ? false
      : { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX) || 10,
  };
}

function getPool() {
  if (!pool) {
    const config = buildPoolConfig();
    if (!config.connectionString && !config.host) {
      throw new Error('Thiếu DATABASE_URL hoặc DB_HOST trong file .env');
    }
    pool = new Pool(config);
    pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected pool error', err);
    });
  }
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

module.exports = { getPool, query };
