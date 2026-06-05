const { query } = require('../config/db');
const schema = require('../config/mealPlanSchema');
const FridgeItemModel = require('./FridgeItemModel');

const { tables: t, columns: c, mealTypes } = schema;

let mealTableReady = false;

class MealPlanModel {
  static async ensureTable() {
    if (mealTableReady) return;
    await query(`
      CREATE TABLE IF NOT EXISTS ${t.mealPlan} (
        ${c.mealPlanId} SERIAL PRIMARY KEY,
        ${c.familyId} INT NOT NULL REFERENCES ${t.family}(gia_dinh_id) ON DELETE CASCADE,
        ${c.mealDate} DATE NOT NULL,
        ${c.mealType} VARCHAR(20) NOT NULL,
        ${c.recipeId} INT NOT NULL REFERENCES ${t.recipe}(cong_thuc_id) ON DELETE CASCADE,
        ${c.createdAt} TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (${c.familyId}, ${c.mealDate}, ${c.mealType}, ${c.recipeId})
      )
    `);
    const alters = [
      `ALTER TABLE ${t.mealPlan} ADD COLUMN IF NOT EXISTS ${c.familyId} INT`,
      `ALTER TABLE ${t.mealPlan} ADD COLUMN IF NOT EXISTS ${c.mealDate} DATE`,
      `ALTER TABLE ${t.mealPlan} ADD COLUMN IF NOT EXISTS ${c.mealType} VARCHAR(20)`,
      `ALTER TABLE ${t.mealPlan} ADD COLUMN IF NOT EXISTS ${c.recipeId} INT`,
      `ALTER TABLE ${t.mealPlan} ADD COLUMN IF NOT EXISTS ${c.createdAt} TIMESTAMPTZ DEFAULT NOW()`,
    ];
    for (const sql of alters) {
      try { await query(sql); } catch { /* column exists */ }
    }
    try {
      await query(`
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = '${t.mealPlan}' AND column_name = 'recipe_id'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = '${t.mealPlan}' AND column_name = '${c.recipeId}'
          ) THEN
            ALTER TABLE ${t.mealPlan} RENAME COLUMN recipe_id TO ${c.recipeId};
          END IF;
        END $$
      `);
    } catch { /* ignore */ }
    mealTableReady = true;
  }

  static async listByFamily(familyGroupId, { fromDate, toDate } = {}) {
    await this.ensureTable();
    const giaDinhId = await FridgeItemModel.resolveGiaDinhId(familyGroupId);
    const params = [giaDinhId];
    let dateFilter = '';
    if (fromDate) {
      params.push(fromDate);
      dateFilter += ` AND kh.${c.mealDate} >= $${params.length}`;
    }
    if (toDate) {
      params.push(toDate);
      dateFilter += ` AND kh.${c.mealDate} <= $${params.length}`;
    }
    const result = await query(
      `
      SELECT kh.${c.mealPlanId} AS id, kh.${c.familyId} AS gia_dinh_id,
             kh.${c.mealDate}::text AS ngay_an, kh.${c.mealType} AS bua_an,
             kh.${c.recipeId} AS cong_thuc_id, ct.${c.recipeTitle} AS ten_mon_an
      FROM ${t.mealPlan} kh
      JOIN ${t.recipe} ct ON ct.cong_thuc_id = kh.${c.recipeId}
      WHERE kh.${c.familyId} = $1 ${dateFilter}
      ORDER BY kh.${c.mealDate}, kh.${c.mealType}
      `,
      params,
    );
    return result.rows;
  }

  static async addEntry({ familyGroupId, mealDate, mealType, recipeId }) {
    await this.ensureTable();
    if (!mealTypes.includes(mealType)) throw new Error('Buổi ăn không hợp lệ.');
    const giaDinhId = await FridgeItemModel.resolveGiaDinhId(familyGroupId);
    const result = await query(
      `
      INSERT INTO ${t.mealPlan} (${c.familyId}, ${c.mealDate}, ${c.mealType}, ${c.recipeId})
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (${c.familyId}, ${c.mealDate}, ${c.mealType}, ${c.recipeId}) DO NOTHING
      RETURNING ${c.mealPlanId} AS id
      `,
      [giaDinhId, mealDate, mealType, Number(recipeId)],
    );
    return result.rows[0]?.id ?? null;
  }

  static async removeEntry({ familyGroupId, mealDate, mealType, recipeId }) {
    await this.ensureTable();
    const giaDinhId = await FridgeItemModel.resolveGiaDinhId(familyGroupId);
    await query(
      `
      DELETE FROM ${t.mealPlan}
      WHERE ${c.familyId} = $1 AND ${c.mealDate} = $2
        AND ${c.mealType} = $3 AND ${c.recipeId} = $4
      `,
      [giaDinhId, mealDate, mealType, Number(recipeId)],
    );
  }

  static async replaceEntry({ familyGroupId, mealDate, mealType, oldRecipeId, newRecipeId }) {
    await this.removeEntry({ familyGroupId, mealDate, mealType, recipeId: oldRecipeId });
    return this.addEntry({ familyGroupId, mealDate, mealType, recipeId: newRecipeId });
  }
}

module.exports = MealPlanModel;
