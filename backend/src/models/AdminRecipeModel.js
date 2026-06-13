const { query, pool } = require('../config/db');

const RECIPE_COLUMNS = 'id, name_vi, name_en, description, instructions, prep_time, cook_time, servings, created_by, is_public, image_url, created_at, updated_at';

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
      `SELECT r.${RECIPE_COLUMNS.split(', ').join(', r.')}
       FROM recipes r
       ${whereClause}
       ORDER BY r.updated_at DESC, r.created_at DESC`,
      params
    );

    // Enrich with ingredients
    const recipeIds = rows.map(r => r.id);
    let ingredientsMap = {};
    if (recipeIds.length > 0) {
      const ingResult = await query(
        `SELECT
           ri.id, ri.recipe_id, ri.name, ri.quantity, ri.unit_id, ri.category_id,
           u.name AS unit_name, u.symbol AS unit_symbol,
           fc.name_vi AS category_name_vi, fc.name_en AS category_name_en
         FROM recipe_ingredients ri
         LEFT JOIN units u ON u.id = ri.unit_id
         LEFT JOIN food_categories fc ON fc.id = ri.category_id
         WHERE ri.recipe_id = ANY($1::int[])
         ORDER BY ri.id ASC`,
        [recipeIds]
      );
      for (const ing of ingResult.rows) {
        if (!ingredientsMap[ing.recipe_id]) ingredientsMap[ing.recipe_id] = [];
        ingredientsMap[ing.recipe_id].push(AdminRecipeModel._mapIngredient(ing));
      }
    }

    return rows.map(r => AdminRecipeModel._map(r, ingredientsMap[r.id] || []));
  }

  static async getById(id) {
    const { rows } = await query(
      `SELECT r.${RECIPE_COLUMNS.split(', ').join(', r.')}
       FROM recipes r
       WHERE r.id = $1`,
      [id]
    );
    if (!rows[0]) return null;

    const ingResult = await query(
      `SELECT
         ri.id, ri.recipe_id, ri.name, ri.quantity, ri.unit_id, ri.category_id,
         u.name AS unit_name, u.symbol AS unit_symbol,
         fc.name_vi AS category_name_vi, fc.name_en AS category_name_en
       FROM recipe_ingredients ri
       LEFT JOIN units u ON u.id = ri.unit_id
       LEFT JOIN food_categories fc ON fc.id = ri.category_id
       WHERE ri.recipe_id = $1
       ORDER BY ri.id ASC`,
      [id]
    );
    const ingredients = ingResult.rows.map(AdminRecipeModel._mapIngredient);
    return AdminRecipeModel._map(rows[0], ingredients);
  }

  static async create({ name_vi, name_en, description, instructions, prep_time, cook_time, servings, is_public, created_by, image_url, ingredients }) {
    // Uniqueness check
    const existing = await query(`SELECT id FROM recipes WHERE name_vi ILIKE $1`, [name_vi.trim()]);
    if (existing.rows.length > 0) throw new Error('Công thức món ăn này đã tồn tại.');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO recipes (name_vi, name_en, description, instructions, prep_time, cook_time, servings, is_public, created_by, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          name_vi.trim(),
          name_en.trim(),
          description || null,
          instructions || '',
          prep_time !== undefined && prep_time !== null ? Number(prep_time) : null,
          cook_time !== undefined && cook_time !== null ? Number(cook_time) : null,
          servings !== undefined && servings !== null ? Number(servings) : null,
          is_public !== undefined ? Boolean(is_public) : true,
          created_by !== undefined && created_by !== null ? Number(created_by) : null,
          image_url ? String(image_url).trim() : null,
        ]
      );
      const recipe_id = rows[0].id;

      await AdminRecipeModel._replaceIngredients(client, recipe_id, ingredients);

      await client.query('COMMIT');
      return AdminRecipeModel.getById(recipe_id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async update(id, { name_vi, name_en, description, instructions, prep_time, cook_time, servings, is_public, created_by, image_url, ingredients }) {
    if (name_vi) {
      const existing = await query(`SELECT id FROM recipes WHERE name_vi ILIKE $1 AND id != $2`, [name_vi.trim(), id]);
      if (existing.rows.length > 0) throw new Error('Công thức món ăn này đã tồn tại.');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rowCount } = await client.query(
        `UPDATE recipes SET
           name_vi      = COALESCE($1, name_vi),
           name_en      = COALESCE($2, name_en),
           description  = COALESCE($3, description),
           instructions = COALESCE($4, instructions),
           prep_time    = COALESCE($5, prep_time),
           cook_time    = COALESCE($6, cook_time),
           servings     = COALESCE($7, servings),
           is_public    = COALESCE($8, is_public),
           created_by   = COALESCE($9, created_by),
           image_url    = COALESCE($10, image_url),
           updated_at   = NOW()
         WHERE id = $11`,
        [
          name_vi ? name_vi.trim() : null,
          name_en ? name_en.trim() : null,
          description ?? null,
          instructions ?? null,
          prep_time !== undefined && prep_time !== null ? Number(prep_time) : null,
          cook_time !== undefined && cook_time !== null ? Number(cook_time) : null,
          servings !== undefined && servings !== null ? Number(servings) : null,
          is_public !== undefined ? Boolean(is_public) : null,
          created_by !== undefined && created_by !== null ? Number(created_by) : null,
          image_url !== undefined && image_url !== null ? String(image_url).trim() : null,
          id,
        ]
      );
      if (rowCount === 0) throw new Error('Không tìm thấy công thức.');

      if (Array.isArray(ingredients)) {
        await AdminRecipeModel._replaceIngredients(client, id, ingredients);
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

  /**
   * Reference data for the ingredient editor's unit_id picker.
   */
  static async getUnits() {
    const { rows } = await query(`SELECT id, name, symbol FROM units ORDER BY name ASC`);
    return rows;
  }

  /**
   * Reference data for the ingredient editor's category_id picker.
   */
  static async getCategories() {
    const { rows } = await query(`SELECT id, name_vi, name_en, description FROM food_categories ORDER BY name_vi ASC`);
    return rows;
  }

  /**
   * Replace all recipe_ingredients rows for a recipe. unit_id is NOT NULL in
   * the schema, so any ingredient missing it is rejected rather than silently
   * inserted with a NULL/garbage value.
   */
  static async _replaceIngredients(client, recipeId, ingredients) {
    await client.query(`DELETE FROM recipe_ingredients WHERE recipe_id = $1`, [recipeId]);
    if (!Array.isArray(ingredients)) return;

    for (const ing of ingredients) {
      const name = String(ing.name || '').trim();
      if (!name) continue;
      const unit_id = Number(ing.unit_id);
      if (!unit_id) {
        throw new Error(`Nguyên liệu "${name}" thiếu đơn vị tính (unit_id).`);
      }
      const category_id = ing.category_id !== undefined && ing.category_id !== null ? Number(ing.category_id) : null;
      await client.query(
        `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit_id, category_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [recipeId, name, Number(ing.quantity) || 0, unit_id, category_id]
      );
    }
  }

  static _mapIngredient(row) {
    return {
      id: row.id,
      recipe_id: row.recipe_id,
      name: row.name,
      quantity: Number(row.quantity),
      unit_id: row.unit_id,
      category_id: row.category_id ?? null,
      unit_name: row.unit_name ?? null,
      unit_symbol: row.unit_symbol ?? null,
      category_name_vi: row.category_name_vi ?? null,
      category_name_en: row.category_name_en ?? null,
    };
  }

  static _map(row, ingredients = []) {
    return {
      id: row.id,
      name_vi: row.name_vi,
      name_en: row.name_en,
      description: row.description,
      instructions: row.instructions,
      prep_time: row.prep_time,
      cook_time: row.cook_time,
      servings: row.servings,
      created_by: row.created_by,
      is_public: row.is_public === true || row.is_public === 't',
      image_url: row.image_url ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      ingredients,
    };
  }
}

module.exports = AdminRecipeModel;
