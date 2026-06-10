const { query, pool } = require('../config/db');

class AdminRecipeModel {
  static async list({ search = null } = {}) {
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(r.name_vi ILIKE $${params.length} OR r.name_en ILIKE $${params.length} OR r.description ILIKE $${params.length})`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT
         r.id                                          AS recipe_id,
         COALESCE(r.name_vi, r.name_en, '')           AS recipe_name,
         r.description,
         r.instructions,
         COALESCE(r.prep_time, 0) + COALESCE(r.cook_time, 0) AS time_minutes,
         r.servings,
         r.is_public,
         r.created_by,
         r.created_at,
         r.updated_at
       FROM recipes r
       ${whereClause}
       ORDER BY r.updated_at DESC, r.created_at DESC`,
      params
    );

    // Enrich with ingredients
    const recipeIds = rows.map(r => r.recipe_id);
    let ingredientsMap = {};
    if (recipeIds.length > 0) {
      const ingResult = await query(
        `SELECT
           ri.recipe_id,
           ri.name       AS food_name,
           ri.quantity,
           COALESCE(u.symbol, u.name, 'g') AS unit
         FROM recipe_ingredients ri
         LEFT JOIN units u ON u.id = ri.unit_id
         WHERE ri.recipe_id = ANY($1::int[])
         ORDER BY ri.id ASC`,
        [recipeIds]
      );
      for (const ing of ingResult.rows) {
        if (!ingredientsMap[ing.recipe_id]) ingredientsMap[ing.recipe_id] = [];
        ingredientsMap[ing.recipe_id].push({
          food_name: ing.food_name,
          quantity: ing.quantity,
          unit: ing.unit,
        });
      }
    }

    return rows.map(r => AdminRecipeModel._map(r, ingredientsMap[r.recipe_id] || []));
  }

  static async getById(id) {
    const { rows } = await query(
      `SELECT
         r.id                                          AS recipe_id,
         COALESCE(r.name_vi, r.name_en, '')           AS recipe_name,
         r.description,
         r.instructions,
         COALESCE(r.prep_time, 0) + COALESCE(r.cook_time, 0) AS time_minutes,
         r.servings,
         r.is_public,
         r.created_by,
         r.created_at,
         r.updated_at
       FROM recipes r
       WHERE r.id = $1`,
      [id]
    );
    if (!rows[0]) return null;

    const ingResult = await query(
      `SELECT ri.name AS food_name, ri.quantity, COALESCE(u.symbol, u.name, 'g') AS unit
       FROM recipe_ingredients ri
       LEFT JOIN units u ON u.id = ri.unit_id
       WHERE ri.recipe_id = $1
       ORDER BY ri.id ASC`,
      [id]
    );
    const ingredients = ingResult.rows.map(i => ({
      food_name: i.food_name,
      quantity: i.quantity,
      unit: i.unit,
    }));
    return AdminRecipeModel._map(rows[0], ingredients);
  }

  static async create({ recipe_name, description, instructions, time_minutes, servings, is_public, ingredients }) {
    // Uniqueness check
    const existing = await query(`SELECT id FROM recipes WHERE name_vi ILIKE $1`, [recipe_name.trim()]);
    if (existing.rows.length > 0) throw new Error('Công thức món ăn này đã tồn tại.');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const instructionText = Array.isArray(instructions)
        ? instructions.join('\n')
        : (instructions || '');

      const prep_time = Number(time_minutes) || 30;

      const { rows } = await client.query(
        `INSERT INTO recipes (name_vi, name_en, description, instructions, prep_time, cook_time, servings, is_public, created_by)
         VALUES ($1, $2, $3, $4, $5, 0, $6, $7, NULL)
         RETURNING id`,
        [recipe_name.trim(), recipe_name.trim(), description || null, instructionText, prep_time, Number(servings) || 4, Boolean(is_public !== false)]
      );
      const recipe_id = rows[0].id;

      if (Array.isArray(ingredients) && ingredients.length > 0) {
        for (const ing of ingredients) {
          const name = String(ing.food_name || ing.name || '').trim();
          if (!name) continue;
          await client.query(
            `INSERT INTO recipe_ingredients (recipe_id, name, quantity) VALUES ($1, $2, $3)`,
            [recipe_id, name, Number(ing.quantity) || 1]
          );
        }
      }

      await client.query('COMMIT');
      return AdminRecipeModel.getById(recipe_id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async update(id, { recipe_name, description, instructions, time_minutes, servings, is_public, ingredients }) {
    if (recipe_name) {
      const existing = await query(`SELECT id FROM recipes WHERE name_vi ILIKE $1 AND id != $2`, [recipe_name.trim(), id]);
      if (existing.rows.length > 0) throw new Error('Công thức món ăn này đã tồn tại.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const instructionText = instructions
        ? (Array.isArray(instructions) ? instructions.join('\n') : instructions)
        : undefined;

      await client.query(
        `UPDATE recipes SET
           name_vi      = COALESCE($1, name_vi),
           name_en      = COALESCE($1, name_en),
           description  = COALESCE($2, description),
           instructions = COALESCE($3, instructions),
           prep_time    = COALESCE($4, prep_time),
           servings     = COALESCE($5, servings),
           is_public    = COALESCE($6, is_public),
           updated_at   = NOW()
         WHERE id = $7`,
        [
          recipe_name ? recipe_name.trim() : null,
          description ?? null,
          instructionText ?? null,
          time_minutes ? Number(time_minutes) : null,
          servings ? Number(servings) : null,
          is_public !== undefined ? Boolean(is_public) : null,
          id,
        ]
      );

      // Replace ingredients if provided
      if (Array.isArray(ingredients)) {
        await client.query(`DELETE FROM recipe_ingredients WHERE recipe_id = $1`, [id]);
        for (const ing of ingredients) {
          const name = String(ing.food_name || ing.name || '').trim();
          if (!name) continue;
          await client.query(
            `INSERT INTO recipe_ingredients (recipe_id, name, quantity) VALUES ($1, $2, $3)`,
            [id, name, Number(ing.quantity) || 1]
          );
        }
      }

      await client.query('COMMIT');
      return AdminRecipeModel.getById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM recipe_ingredients WHERE recipe_id = $1`, [id]);
      await client.query(`DELETE FROM meal_plan_items WHERE recipe_id = $1`, [id]);
      const { rowCount } = await client.query(`DELETE FROM recipes WHERE id = $1`, [id]);
      if (rowCount === 0) throw new Error('Không tìm thấy công thức.');
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async bulkDelete(ids) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM recipe_ingredients WHERE recipe_id = ANY($1::int[])`, [ids]);
      await client.query(`DELETE FROM meal_plan_items WHERE recipe_id = ANY($1::int[])`, [ids]);
      await client.query(`DELETE FROM recipes WHERE id = ANY($1::int[])`, [ids]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static _map(row, ingredients = []) {
    return {
      recipe_id: String(row.recipe_id),
      recipe_name: row.recipe_name,
      description: row.description,
      instructions: row.instructions ? row.instructions.split('\n').filter(Boolean) : [],
      time_minutes: row.time_minutes,
      servings: row.servings,
      is_public: row.is_public,
      created_by: row.created_by ? String(row.created_by) : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      ingredients,
    };
  }
}

module.exports = AdminRecipeModel;
