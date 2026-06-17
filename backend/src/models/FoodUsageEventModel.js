const { query } = require('../config/db');

let ensurePromise = null;

function normalizeQuantity(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
}

class FoodUsageEventModel {
  static ensureTable() {
    if (!ensurePromise) {
      ensurePromise = query(`
        CREATE TABLE IF NOT EXISTS food_usage_events (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          food_id INTEGER REFERENCES foods(id) ON DELETE SET NULL,
          fridge_item_id INTEGER,
          event_type VARCHAR(30) NOT NULL,
          quantity NUMERIC DEFAULT 0,
          unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
          recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    }
    return ensurePromise;
  }

  static async record({ client = null, userId, foodId = null, fridgeItemId = null, eventType, quantity = 0, unitId = null, recipeId = null }) {
    await this.ensureTable();
    const executor = client || { query };
    await executor.query(
      `INSERT INTO food_usage_events
       (user_id, food_id, fridge_item_id, event_type, quantity, unit_id, recipe_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId ? Number(userId) : null,
        foodId ? Number(foodId) : null,
        fridgeItemId ? Number(fridgeItemId) : null,
        eventType,
        normalizeQuantity(quantity),
        unitId ? Number(unitId) : null,
        recipeId ? Number(recipeId) : null,
      ]
    );
  }
}

module.exports = FoodUsageEventModel;
