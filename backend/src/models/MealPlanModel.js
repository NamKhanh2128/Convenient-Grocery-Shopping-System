const { query } = require('../config/db');
const schema = require('../config/mealPlanSchema');

const { tables: t, columns: c, mealTypes } = schema;

function toDate(value) {
  return String(value || '').slice(0, 10);
}

class MealPlanModel {
  static async ensureTable() {
    // English schema is the source of truth and already exists in Supabase.
  }

  static async findOrCreatePlan({ userId, mealDate }) {
    const date = toDate(mealDate);
    const existing = await query(
      `SELECT ${c.mealPlanId} AS id
       FROM ${t.mealPlan}
       WHERE ${c.userId} = $1
         AND ${c.startDate} <= $2::date
         AND ${c.endDate} >= $2::date
       ORDER BY ${c.createdAt} DESC
       LIMIT 1`,
      [Number(userId), date]
    );
    if (existing.rows[0]) return existing.rows[0].id;

    const created = await query(
      `INSERT INTO ${t.mealPlan} (${c.userId}, ${c.planType}, ${c.startDate}, ${c.endDate}, ${c.status})
       VALUES ($1, 'weekly', $2, $2, 'active')
       RETURNING ${c.mealPlanId} AS id`,
      [Number(userId), date]
    );
    return created.rows[0].id;
  }

  static async listByFamily(_familyGroupId, { fromDate, toDate: endDate, userId } = {}) {
    await this.ensureTable();
    const params = [Number(userId)];
    let dateFilter = '';
    if (fromDate) {
      params.push(fromDate);
      dateFilter += ` AND mpi.${c.mealDate} >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      dateFilter += ` AND mpi.${c.mealDate} <= $${params.length}`;
    }

    const result = await query(
      `SELECT
         mpi.${c.itemId} AS id,
         mp.${c.mealPlanId} AS meal_plan_id,
         mpi.${c.mealDate}::text AS meal_date,
         mpi.${c.mealType} AS meal_type,
         mpi.${c.recipeId} AS recipe_id,
         COALESCE(r.${c.recipeTitle}, r.name_en) AS recipe_name
       FROM ${t.mealPlanItem} mpi
       JOIN ${t.mealPlan} mp ON mp.${c.mealPlanId} = mpi.${c.itemMealPlanId}
       JOIN ${t.recipe} r ON r.id = mpi.${c.recipeId}
       WHERE mp.${c.userId} = $1 ${dateFilter}
       ORDER BY mpi.${c.mealDate}, mpi.${c.mealType}`,
      params
    );
    return result.rows;
  }

  static async addEntry({ userId, mealDate, mealType, recipeId }) {
    await this.ensureTable();
    if (!mealTypes.includes(mealType)) throw new Error('Buổi ăn không hợp lệ.');
    const mealPlanId = await this.findOrCreatePlan({ userId, mealDate });
    const result = await query(
      `INSERT INTO ${t.mealPlanItem} (${c.itemMealPlanId}, ${c.recipeId}, ${c.mealDate}, ${c.mealType})
       VALUES ($1, $2, $3, $4)
       RETURNING ${c.itemId} AS id`,
      [mealPlanId, Number(recipeId), toDate(mealDate), mealType]
    );
    return result.rows[0]?.id ?? null;
  }

  static async removeEntry({ userId, mealDate, mealType, recipeId }) {
    await this.ensureTable();
    await query(
      `DELETE FROM ${t.mealPlanItem} mpi
       USING ${t.mealPlan} mp
       WHERE mp.${c.mealPlanId} = mpi.${c.itemMealPlanId}
         AND mp.${c.userId} = $1
         AND mpi.${c.mealDate} = $2
         AND mpi.${c.mealType} = $3
         AND mpi.${c.recipeId} = $4`,
      [Number(userId), toDate(mealDate), mealType, Number(recipeId)]
    );
  }

  static async replaceEntry({ userId, mealDate, mealType, oldRecipeId, newRecipeId }) {
    await this.removeEntry({ userId, mealDate, mealType, recipeId: oldRecipeId });
    return this.addEntry({ userId, mealDate, mealType, recipeId: newRecipeId });
  }
}

module.exports = MealPlanModel;
