const { query } = require('./src/config/db');

async function check() {
  const result = await query(`
    SELECT pg_get_constraintdef(c.oid) AS constraint_def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'meal_plan_items_meal_type_check'
  `);
  console.log(result.rows);
  process.exit(0);
}

check();
