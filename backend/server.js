import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { closePool, pool, testConnection } from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import familyRoutes from './src/routes/familyRoutes.js';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/api/family', familyRoutes);

app.get('/health', async (_req, res) => {
  try {
    const db = await testConnection();

    res.json({
      status: 'ok',
      database: db,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: {
        connected: false,
        message: error.message,
      },
    });
  }
});

app.get('/api/users', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, phone, role, is_locked, created_at, updated_at FROM users LIMIT 50'
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Cannot load users', error: error.message });
  }
});

const server = app.listen(PORT, async () => {
  console.log(`API server is running on port ${PORT}`);

  try {
    const db = await testConnection();
    console.log(`Database connected: ${db.database} on ${db.host}`);
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
  }
});

async function shutdown() {
  await closePool();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
