require('dotenv').config();
const MealPlanModel = require('./src/models/MealPlanModel');

async function check() {
  const plans = await MealPlanModel.getPlans(21, '2026-06-01', '2026-06-30');
  console.log(JSON.stringify(plans, null, 2));
  process.exit(0);
}

check();
