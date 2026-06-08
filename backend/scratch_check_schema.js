require('dotenv').config();
const { query } = require('./src/config/db');

async function check() {
  try {
    const res = await query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('meal_plans', 'meal_plan_items', 'recipes', 'users')
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
check();
