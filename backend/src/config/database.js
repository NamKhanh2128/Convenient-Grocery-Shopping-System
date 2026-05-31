import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
});

pool.query('SELECT NOW()')
  .then(res => {
    console.log('DB CONNECTED');
    console.log(res.rows);
  })
  .catch(err => {
    console.error('DB ERROR');
    console.error(err);
  });

export default pool;