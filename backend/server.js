require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fridgeRoutes = require('./src/routes/fridgeRoutes');
const mealPlanRoutes = require('./src/routes/mealPlanRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'OK' });
});

app.get('/health/db', async (_req, res) => {
  try {
    const { query } = require('./src/config/db');
    const result = await query('SELECT NOW() AS server_time');

    let chiTietTuLanhCount = null;
    let fridgeTable = 'chi_tiet_tu_lanh';
    let fridgeTableError = null;

    try {
      const fridgeCheck = await query(
        'SELECT COUNT(*)::int AS count FROM chi_tiet_tu_lanh',
      );
      chiTietTuLanhCount = fridgeCheck.rows[0]?.count ?? 0;
    } catch (tableError) {
      fridgeTableError = tableError.message;
    }

    res.status(200).json({
      success: true,
      message: 'Kết nối Supabase PostgreSQL thành công',
      data: {
        serverTime: result.rows[0]?.server_time,
        fridgeTable,
        chiTietTuLanhCount,
        fridgeTableOk: fridgeTableError === null,
        ...(fridgeTableError ? { fridgeTableError } : {}),
      },
    });
  } catch (error) {
    console.error('[health/db]', error);
    res.status(500).json({
      success: false,
      message: 'Không kết nối được database',
      error: error.message,
    });
  }
});

app.use('/api/fridge', fridgeRoutes);
app.use('/api/v1/meal-plans', mealPlanRoutes);
app.use('/api/v1/auth', authRoutes);

app.use((err, _req, res, _next) => {
  console.error('[UnhandledError]', err);
  res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
});

const server = app.listen(PORT, () => {
  console.log(`NATEAT API listening on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nCổng ${PORT} đang được dùng — backend có thể ĐÃ CHẠY SẴN.`);
    console.error(`  Kiểm tra: http://localhost:${PORT}/health`);
    console.error(`  Khởi động lại: npm run restart`);
    console.error(`  Chỉ tắt backend:  npm run stop\n`);
    process.exit(1);
  }
  throw err;
});
