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

// ─── Admin routes ────────────────────────────────────────────────────────────
const adminUserRoutes     = require('./src/routes/adminUserRoutes');
const adminFoodRoutes     = require('./src/routes/adminFoodRoutes');
const adminRecipeRoutes   = require('./src/routes/adminRecipeRoutes');
const adminRecipeCategoryRoutes = require('./src/routes/adminRecipeCategoryRoutes');
const adminShoppingRoutes = require('./src/routes/adminShoppingRoutes');
const adminMealPlanRoutes = require('./src/routes/adminMealPlanRoutes');
const adminFamilyRoutes   = require('./src/routes/adminFamilyRoutes');
const adminStatsRoutes    = require('./src/routes/adminStatsRoutes');
const adminSettingsRoutes = require('./src/routes/adminSettingsRoutes');
const adminNotificationRoutes = require('./src/routes/adminNotificationRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/fridge', fridgeRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/shopping-lists', shoppingRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/meal-plans', mealPlanRoutes);

// ─── Admin API namespace ─────────────────────────────────────────────────────
app.use('/api/admin/users',      adminUserRoutes);
app.use('/api/admin/foods',      adminFoodRoutes);
app.use('/api/admin/recipes',    adminRecipeRoutes);
app.use('/api/admin/recipe-categories', adminRecipeCategoryRoutes);
app.use('/api/admin/shopping-lists', adminShoppingRoutes);
app.use('/api/admin/meal-plans', adminMealPlanRoutes);
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
