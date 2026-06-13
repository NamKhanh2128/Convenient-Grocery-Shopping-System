const { query } = require('../config/db');
const schema = require('../config/mealPlanSchema');

const { tables: t, columns: c } = schema;

// ── Meal-type translation layer ───────────────────────────────────────────────
// DB CHECK constraint requires English values: breakfast / lunch / dinner / snack
// Frontend uses Vietnamese: Sáng / Trưa / Tối / Bữa phụ
const VN_TO_EN = { 'Sáng': 'breakfast', 'Trưa': 'lunch', 'Tối': 'dinner', 'Bữa phụ': 'snack' };
const EN_TO_VN = { breakfast: 'Sáng', lunch: 'Trưa', dinner: 'Tối', snack: 'Bữa phụ' };
const DB_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

function toDbMealType(value) {
  if (!value) return 'breakfast';
  if (VN_TO_EN[value]) return VN_TO_EN[value];
  if (DB_MEAL_TYPES.includes(value)) return value;
  return 'breakfast';
}

function fromDbMealType(value) {
  if (!value) return 'Sáng';
  if (EN_TO_VN[value]) return EN_TO_VN[value];
  if (VN_TO_EN[value]) return value; // already Vietnamese
  return 'Sáng';
}

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
         mpi.${c.itemId}                        AS id,
         mp.${c.mealPlanId}                     AS meal_plan_id,
         mpi.${c.mealDate}::text                AS meal_date,
         mpi.${c.mealType}                      AS meal_type,
         mpi.${c.recipeId}                      AS recipe_id,
         COALESCE(r.${c.recipeTitle}, r.name_en) AS recipe_name,
         COALESCE(mpi.is_cooked, false)          AS is_cooked
       FROM ${t.mealPlanItem} mpi
       JOIN ${t.mealPlan} mp ON mp.${c.mealPlanId} = mpi.${c.itemMealPlanId}
       JOIN ${t.recipe} r    ON r.id = mpi.${c.recipeId}
       WHERE mp.${c.userId} = $1 ${dateFilter}
       ORDER BY mpi.${c.mealDate}, mpi.${c.mealType}`,
      params
    );

    // Translate meal_type back to Vietnamese so frontend can match "Sáng/Trưa/Tối"
    return result.rows.map((row) => ({
      ...row,
      meal_type: fromDbMealType(row.meal_type),
    }));
  }

  static async addEntry({ userId, mealDate, mealType, recipeId }) {
    await this.ensureTable();
    const dbMealType = toDbMealType(mealType);

    // Prevent duplicate — same user/date/slot/recipe
    const dup = await query(
      `SELECT mpi.${c.itemId} AS id
       FROM ${t.mealPlanItem} mpi
       JOIN ${t.mealPlan} mp ON mp.${c.mealPlanId} = mpi.${c.itemMealPlanId}
       WHERE mp.${c.userId} = $1
         AND mpi.${c.mealDate} = $2
         AND mpi.${c.mealType} = $3
         AND mpi.${c.recipeId} = $4
       LIMIT 1`,
      [Number(userId), toDate(mealDate), dbMealType, Number(recipeId)]
    );
    if (dup.rows[0]) return dup.rows[0].id;

    const mealPlanId = await this.findOrCreatePlan({ userId, mealDate });
    const result = await query(
      `INSERT INTO ${t.mealPlanItem} (${c.itemMealPlanId}, ${c.recipeId}, ${c.mealDate}, ${c.mealType})
       VALUES ($1, $2, $3, $4)
       RETURNING ${c.itemId} AS id`,
      [mealPlanId, Number(recipeId), toDate(mealDate), dbMealType]
    );
    return result.rows[0]?.id ?? null;
  }

  static async removeEntry({ userId, mealDate, mealType, recipeId }) {
    await this.ensureTable();
    const dbMealType = toDbMealType(mealType);
    await query(
      `DELETE FROM ${t.mealPlanItem} mpi
       USING ${t.mealPlan} mp
       WHERE mp.${c.mealPlanId} = mpi.${c.itemMealPlanId}
         AND mp.${c.userId} = $1
         AND mpi.${c.mealDate} = $2
         AND mpi.${c.mealType} = $3
         AND mpi.${c.recipeId} = $4`,
      [Number(userId), toDate(mealDate), dbMealType, Number(recipeId)]
    );
  }

  static async replaceEntry({ userId, mealDate, mealType, oldRecipeId, newRecipeId }) {
    await this.removeEntry({ userId, mealDate, mealType, recipeId: oldRecipeId });
    return this.addEntry({ userId, mealDate, mealType, recipeId: newRecipeId });
  }

  static async autoGenerate({ userId, dates, overwrite = false }) {
    const mealTypes = ['breakfast', 'lunch', 'dinner'];

    const { rows: recipes } = await query(
      `SELECT id FROM recipes WHERE is_public = true ORDER BY RANDOM() LIMIT 100`
    );
    if (!recipes.length) throw new Error('Chưa có công thức nào trong hệ thống để tạo kế hoạch.');

    let recipeIdx = 0;
    const added = [];

    for (const date of dates) {
      for (const dbMealType of mealTypes) {
        const existing = await query(
          `SELECT mpi.${c.itemId} AS id
           FROM ${t.mealPlanItem} mpi
           JOIN ${t.mealPlan} mp ON mp.${c.mealPlanId} = mpi.${c.itemMealPlanId}
           WHERE mp.${c.userId} = $1 AND mpi.${c.mealDate} = $2 AND mpi.${c.mealType} = $3
           LIMIT 1`,
          [Number(userId), toDate(date), dbMealType]
        );

        if (existing.rows.length > 0 && !overwrite) continue;

        if (overwrite && existing.rows.length > 0) {
          await query(
            `DELETE FROM ${t.mealPlanItem} mpi
             USING ${t.mealPlan} mp
             WHERE mp.${c.mealPlanId} = mpi.${c.itemMealPlanId}
               AND mp.${c.userId} = $1
               AND mpi.${c.mealDate} = $2
               AND mpi.${c.mealType} = $3`,
            [Number(userId), toDate(date), dbMealType]
          );
        }

        const recipe = recipes[recipeIdx % recipes.length];
        recipeIdx++;

        const mealPlanId = await this.findOrCreatePlan({ userId, mealDate: date });
        await query(
          `INSERT INTO ${t.mealPlanItem} (${c.itemMealPlanId}, ${c.recipeId}, ${c.mealDate}, ${c.mealType})
           VALUES ($1, $2, $3, $4)`,
          [mealPlanId, Number(recipe.id), toDate(date), dbMealType]
        );
        added.push({ date, meal_type: fromDbMealType(dbMealType), recipe_id: recipe.id });
      }
    }

    return added;
  }

  static async getItemCookedState({ userId, mealDate, mealType, recipeId }) {
    const dbMealType = toDbMealType(mealType);
    const result = await query(
      `SELECT COALESCE(mpi.is_cooked, false) AS is_cooked
       FROM ${t.mealPlanItem} mpi
       JOIN ${t.mealPlan} mp ON mp.${c.mealPlanId} = mpi.${c.itemMealPlanId}
       WHERE mp.${c.userId} = $1
         AND mpi.${c.mealDate} = $2
         AND mpi.${c.mealType} = $3
         AND mpi.${c.recipeId} = $4
       LIMIT 1`,
      [Number(userId), toDate(mealDate), dbMealType, Number(recipeId)]
    );
    return Boolean(result.rows[0]?.is_cooked);
  }

  static async markCooked({ userId, mealDate, mealType, recipeId, isCooked = true }) {
    const dbMealType = toDbMealType(mealType);
    await query(
      `UPDATE ${t.mealPlanItem} mpi
       SET is_cooked = $5
       FROM ${t.mealPlan} mp
       WHERE mp.${c.mealPlanId} = mpi.${c.itemMealPlanId}
         AND mp.${c.userId} = $1
         AND mpi.${c.mealDate} = $2
         AND mpi.${c.mealType} = $3
         AND mpi.${c.recipeId} = $4`,
      [Number(userId), toDate(mealDate), dbMealType, Number(recipeId), Boolean(isCooked)]
    );
  }
}

module.exports = MealPlanModel;
