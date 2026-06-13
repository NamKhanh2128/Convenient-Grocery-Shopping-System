require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { closePool, pool, query, testConnection } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const familyRoutes = require('./src/routes/familyRoutes');
const fridgeRoutes = require('./src/routes/fridgeRoutes');
const recipeRoutes = require('./src/routes/recipeRoutes');
const shoppingRoutes = require('./src/routes/shoppingRoutes');
const foodRoutes = require('./src/routes/foodRoutes');
const mealPlanRoutes = require('./src/routes/mealPlanRoutes');
const statsRoutes = require('./src/routes/statsRoutes');

// ─── Admin routes ────────────────────────────────────────────────────────────
const adminUserRoutes     = require('./src/routes/adminUserRoutes');
const adminFoodRoutes     = require('./src/routes/adminFoodRoutes');
const adminRecipeRoutes   = require('./src/routes/adminRecipeRoutes');
const adminFoodCategoryRoutes = require('./src/routes/adminFoodCategoryRoutes');
const adminUnitRoutes         = require('./src/routes/adminUnitRoutes');
const adminFamilyRoutes   = require('./src/routes/adminFamilyRoutes');
const adminStatsRoutes    = require('./src/routes/adminStatsRoutes');
const adminSettingsRoutes = require('./src/routes/adminSettingsRoutes');
const adminNotificationRoutes = require('./src/routes/adminNotificationRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ────────────────────────────────────────────────────────────────────
// In development: allow every origin (localhost, LAN IPs, 127.0.0.1, any port).
// In production: allow whitelisted origins from CORS_ORIGINS, plus localhost and
// any *.vercel.app deployment of this project (preview URLs change per deploy).
//
// CORS_ORIGINS entries may be exact origins or regex patterns prefixed with
// 'regex:'. Example:
//   https://myapp.vercel.app,regex:https://myapp-.*\.vercel\.app
const isProduction = process.env.NODE_ENV === 'production';
const CORS_ORIGINS_ENV = process.env.CORS_ORIGINS
  || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,https://convenient-grocery-shopping-system.vercel.app,https://convenient-grocery-shopping-system-frontend-user-pxtjekkft.vercel.app,https://convenient-grocery-shopping-system-pink.vercel.app';

// Split CORS_ORIGINS into exact strings and compiled RegExp patterns.
const { exactOrigins, originPatterns } = (() => {
  const exact = [];
  const patterns = [];
  for (const entry of CORS_ORIGINS_ENV.split(',').map((o) => o.trim()).filter(Boolean)) {
    if (entry.startsWith('regex:')) {
      try { patterns.push(new RegExp(entry.slice(6))); } catch { /* ignore bad regex */ }
    } else {
      exact.push(entry);
    }
  }
  return { exactOrigins: exact, originPatterns: patterns };
})();

function isAllowedOrigin(origin) {
  // No Origin header => same-origin, curl, or server-to-server: always allow.
  if (!origin) return true;
  if (exactOrigins.includes(origin)) return true;
  if (originPatterns.some((re) => re.test(origin))) return true;
  try {
    const host = new URL(origin).hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (host.endsWith('.vercel.app')) return true;
  } catch {
    return false;
  }
  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    // In dev allow everything; in prod enforce the allow-list. Never throw —
    // a disallowed origin just gets no CORS headers (callback(null, false)),
    // which the browser blocks cleanly instead of triggering a 500.
    callback(null, !isProduction || isAllowedOrigin(origin));
  },
  credentials: true,
};

app.use(cors(corsOptions));
// Answer CORS preflight (OPTIONS) for every route with the same policy.
app.options('*', cors(corsOptions));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/fridge', fridgeRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/shopping-lists', shoppingRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/stats', statsRoutes);

// ─── Admin API namespace ─────────────────────────────────────────────────────
app.use('/api/admin/users',      adminUserRoutes);
app.use('/api/admin/foods',      adminFoodRoutes);
app.use('/api/admin/recipes',    adminRecipeRoutes);
app.use('/api/admin/food-categories', adminFoodCategoryRoutes);
app.use('/api/admin/units',            adminUnitRoutes);
app.use('/api/admin/families',   adminFamilyRoutes);
app.use('/api/admin/stats',      adminStatsRoutes);
app.use('/api/admin/settings',   adminSettingsRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);

// Backward-compatible route aliases used by existing frontend flows.
app.use('/shopping-lists', shoppingRoutes);
app.use('/foods', foodRoutes);
app.use('/meal-plans', mealPlanRoutes);

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

app.get('/health/db', async (_req, res) => {
  try {
    const result = await query('SELECT NOW() AS server_time');

    res.status(200).json({
      success: true,
      message: 'Ket noi database thanh cong',
      data: {
        serverTime: result.rows[0]?.server_time,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Khong ket noi duoc database',
      error: error.message,
    });
  }
});

app.get('/api/users', async (_req, res) => {
  // Dev-only helper that dumps the user table without auth. Disabled in
  // production to avoid leaking the full user list.
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, phone, role, is_locked, created_at, updated_at FROM users LIMIT 50'
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Cannot load users', error: error.message });
  }
});

app.use((err, _req, res, _next) => {
  console.error('[UnhandledError]', err);
  res.status(500).json({ success: false, message: 'Loi server noi bo' });
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
