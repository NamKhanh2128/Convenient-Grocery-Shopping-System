require('dotenv').config();
const { query } = require('./src/config/db');

async function check() {
  const plans = await query('SELECT * FROM meal_plans');
  const items = await query('SELECT * FROM meal_plan_items');
  console.log("PLANS:", plans.rows);
  console.log("ITEMS:", items.rows);
  process.exit(0);
}

check();
