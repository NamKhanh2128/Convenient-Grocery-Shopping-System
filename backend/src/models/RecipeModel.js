const { query } = require('../config/db');
const ShoppingService = require('../services/ShoppingService');
const FridgeItemModel = require('./FridgeItemModel');
const { normalizeUnitName } = require('../config/unitsConfig');

function isNumericId(value) {
  return /^\d+$/.test(String(value ?? ''));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function mapRecipe(row, ingredients = []) {
  if (!row) return null;
  return {
    id: String(row.id),
    tieu_de: row.name_vi || row.name_en || '',
    mo_ta: row.description || '',
    huong_dan: row.instructions || '',
    instructions: String(row.instructions || '').split(/\r?\n/).filter(Boolean),
    thoi_gian_phut: Number(row.prep_time || 0) + Number(row.cook_time || 0) || 30,
    khau_phan: Number(row.servings || 4),
    calories: null,
    do_kho: 'Trung bình',
    hinh_anh_url: row.image_url || '',
    loai_quyen: row.is_public ? 'SYSTEM' : 'PRIVATE',
    danh_muc: null,
    nguoi_tao_id: row.created_by ? String(row.created_by) : null,
    gia_dinh_id: null,
    da_yeu_thich: Boolean(row.da_yeu_thich),
    ingredient_count: row.ingredient_count !== undefined ? Number(row.ingredient_count) : ingredients.length,
    nguyen_lieu: ingredients,
  };
}

function mapIngredient(row) {
  return {
    id: String(row.id),
    ten_nguyen_lieu: row.name,
    so_luong: row.quantity !== null && row.quantity !== undefined ? Number(row.quantity) : null,
    // Prefer the canonical unit name ("lít") over its DB symbol ("l") — the
    // frontend's FoodUnit type and every unit dropdown use the Vietnamese
    // name, and symbol only differs from name for "lít" today.
    don_vi: row.unit_name || row.unit_symbol || null,
    thuc_pham_id: null,
    ten_thuc_pham: row.name,
  };
}

class RecipeModel {
  static async ensureRecipeTables() {
    // English schema is the source of truth and already exists in Supabase.
  }

  static async getCategories() {
    const { rows } = await query(
      `SELECT danh_muc_cong_thuc_id AS id, ten_danh_muc AS ten FROM danh_muc_cong_thuc ORDER BY ten_danh_muc ASC`
    );
    return rows;
  }

  static async getPopular({ userId, limit = 5 }) {
    // Combines two cook-tracking sources so a recipe's popularity reflects
    // however it was cooked: via the meal plan ("Đã nấu" → meal_plan_items.
    // is_cooked) or directly on the recipe page ("Sau khi nấu" → a 'cooked'
    // food_usage_events row, one per cook action — see markCooked above).
    const { rows } = await query(
      `SELECT r.*,
              (COALESCE(mp_count.cnt, 0) + COALESCE(direct_count.cnt, 0))::int AS cook_count,
              (SELECT COUNT(*)::int FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) AS ingredient_count
       FROM recipes r
       LEFT JOIN (
         SELECT mpi.recipe_id, COUNT(*) AS cnt
         FROM meal_plan_items mpi
         JOIN meal_plans mp ON mp.id = mpi.meal_plan_id
         WHERE mpi.is_cooked = true AND mp.user_id = $1
         GROUP BY mpi.recipe_id
       ) mp_count ON mp_count.recipe_id = r.id
       LEFT JOIN (
         SELECT recipe_id, COUNT(*) AS cnt
         FROM food_usage_events
         WHERE event_type = 'cooked' AND user_id = $1 AND recipe_id IS NOT NULL
         GROUP BY recipe_id
       ) direct_count ON direct_count.recipe_id = r.id
       WHERE (r.is_public = true OR r.created_by = $1)
         AND (COALESCE(mp_count.cnt, 0) + COALESCE(direct_count.cnt, 0)) > 0
       ORDER BY cook_count DESC
       LIMIT $2`,
      [Number(userId), Math.max(1, Number(limit) || 5)]
    );
    const marked = await this.markFavorites(rows, userId);
    return marked.map((row) => ({ ...mapRecipe(row, []), cook_count: row.cook_count }));
  }

  static async loadIngredients(recipeIds) {
    if (!recipeIds.length) return new Map();
    const { rows } = await query(
      `SELECT ri.id, ri.recipe_id, ri.name, ri.quantity, u.name AS unit_name, u.symbol AS unit_symbol
       FROM recipe_ingredients ri
       LEFT JOIN units u ON u.id = ri.unit_id
       WHERE ri.recipe_id = ANY($1::int[])
       ORDER BY ri.id ASC`,
      [recipeIds.map(Number)]
    );
    const map = new Map();
    for (const row of rows) {
      const key = String(row.recipe_id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(mapIngredient(row));
    }
    return map;
  }

  static async markFavorites(rows, userId) {
    if (!userId || !rows.length) return rows;
    const ids = rows.map((row) => Number(row.id));
    const fav = await query(
      `SELECT recipe_id FROM favorite_recipes WHERE user_id = $1 AND recipe_id = ANY($2::int[])`,
      [Number(userId), ids]
    );
    const favSet = new Set(fav.rows.map((row) => String(row.recipe_id)));
    return rows.map((row) => ({ ...row, da_yeu_thich: favSet.has(String(row.id)) }));
  }

  static async listBase({ search = null, limit = 100, offset = 0, publicOnly = false, userId = null, privacy = null, timeTag = null } = {}) {
    const params = [search || null, Math.min(200, Math.max(1, Number(limit) || 100)), Math.max(0, Number(offset) || 0)];

    // Base visibility clause
    let visibilityClause = '';
    if (publicOnly) {
      visibilityClause = 'AND r.is_public = true';
    } else if (userId) {
      params.push(Number(userId));
      visibilityClause = `AND (r.is_public = true OR r.created_by = $${params.length})`;
    }

    // Privacy sub-filter
    let privacyClause = '';
    if (privacy && privacy !== 'all') {
      if (privacy === 'SYSTEM') {
        privacyClause = 'AND r.is_public = true';
      } else if (privacy === 'PRIVATE' && userId) {
        params.push(Number(userId));
        privacyClause = `AND r.is_public = false AND r.created_by = $${params.length}`;
      }
    }

    // Time tag filter
    let timeClause = '';
    if (timeTag && timeTag !== 'all') {
      if (timeTag === 'nhanh') timeClause = 'AND (COALESCE(r.prep_time, 0) + COALESCE(r.cook_time, 0)) < 30';
      else if (timeTag === 'vua') timeClause = 'AND (COALESCE(r.prep_time, 0) + COALESCE(r.cook_time, 0)) BETWEEN 30 AND 60';
      else if (timeTag === 'lau') timeClause = 'AND (COALESCE(r.prep_time, 0) + COALESCE(r.cook_time, 0)) > 60';
    }

    const { rows } = await query(
      `SELECT r.*,
              (SELECT COUNT(*)::int FROM recipe_ingredients ri WHERE ri.recipe_id = r.id) AS ingredient_count
       FROM recipes r
       WHERE ($1::text IS NULL OR r.name_vi ILIKE '%' || $1 || '%' OR r.name_en ILIKE '%' || $1 || '%')
         ${visibilityClause}
         ${privacyClause}
         ${timeClause}
       ORDER BY r.updated_at DESC, r.created_at DESC
       LIMIT $2 OFFSET $3`,
      params
    );
    return rows;
  }

  static async findPublic({ search, limit, offset, lite = true }) {
    const rows = await this.listBase({ search, limit, offset, publicOnly: true });
    if (lite) return rows.map((row) => mapRecipe(row, []));
    const ingredients = await this.loadIngredients(rows.map((row) => row.id));
    return rows.map((row) => mapRecipe(row, ingredients.get(String(row.id)) || []));
  }

  static async findAccessible({ userId, search, limit, offset, lite = true, privacy = null, timeTag = null }) {
    let rows = await this.listBase({ search, limit, offset, userId, privacy, timeTag });
    rows = await this.markFavorites(rows, userId);
    if (lite) return rows.map((row) => mapRecipe(row, []));
    const ingredients = await this.loadIngredients(rows.map((row) => row.id));
    return rows.map((row) => mapRecipe(row, ingredients.get(String(row.id)) || []));
  }

  static async findById({ id, userId }) {
    const { rows } = await query(
      `SELECT r.*,
              EXISTS(SELECT 1 FROM favorite_recipes fr WHERE fr.recipe_id = r.id AND fr.user_id = $2) AS da_yeu_thich
       FROM recipes r
       WHERE r.id = $1 AND (r.is_public = true OR r.created_by = $2)
       LIMIT 1`,
      [Number(id), userId ? Number(userId) : null]
    );
    if (!rows[0]) return null;
    const ingredients = await this.loadIngredients([rows[0].id]);
    return mapRecipe(rows[0], ingredients.get(String(rows[0].id)) || []);
  }

  static async findPublicById(id) {
    const { rows } = await query(`SELECT * FROM recipes WHERE id = $1 AND is_public = true LIMIT 1`, [Number(id)]);
    if (!rows[0]) return null;
    const ingredients = await this.loadIngredients([rows[0].id]);
    return mapRecipe(rows[0], ingredients.get(String(rows[0].id)) || []);
  }

  // See FridgeItemModel.findUnitId — resolves to a canonical unit name
  // instead of creating a new row for whatever string was sent in.
  static async findUnitId(unit) {
    const canonicalName = normalizeUnitName(unit);
    const found = await query(`SELECT id FROM units WHERE lower(name) = lower($1) LIMIT 1`, [canonicalName]);
    if (found.rows[0]) return found.rows[0].id;
    const created = await query(`INSERT INTO units (name, symbol) VALUES ($1, $1) RETURNING id`, [canonicalName]);
    return created.rows[0].id;
  }

  static async findCategoryId() {
    const found = await query(`SELECT id FROM food_categories ORDER BY id LIMIT 1`);
    if (found.rows[0]) return found.rows[0].id;
    const created = await query(`INSERT INTO food_categories (name_vi, name_en) VALUES ('Khác', 'Other') RETURNING id`);
    return created.rows[0].id;
  }

  static async replaceIngredients(recipeId, ingredients = []) {
    await query(`DELETE FROM recipe_ingredients WHERE recipe_id = $1`, [Number(recipeId)]);
    for (const ing of ingredients) {
      const name = ing.ten_nguyen_lieu || ing.ten || ing.name || ing.food_name;
      if (!name) continue;
      await query(
        `INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit_id, category_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          Number(recipeId),
          String(name).trim(),
          Number(ing.so_luong ?? ing.quantity ?? 1),
          await this.findUnitId(ing.don_vi || ing.unit || 'g'),
          await this.findCategoryId(),
        ]
      );
    }
  }

  static async create({ userId, data }) {
    const totalTime = Number(data.thoi_gian_phut || data.time_minutes || 30);
    const { rows } = await query(
      `INSERT INTO recipes (name_vi, name_en, description, instructions, prep_time, cook_time, servings, created_by, is_public)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8)
       RETURNING id`,
      [
        String(data.tieu_de || data.recipe_name).trim(),
        String(data.name_en || data.tieu_de || data.recipe_name).trim(),
        data.mo_ta || data.description || null,
        Array.isArray(data.instructions) ? data.instructions.join('\n') : String(data.huong_dan || data.instructions || ''),
        totalTime,
        Number(data.khau_phan || data.servings || 4),
        userId ? Number(userId) : null,
        data.loai_quyen !== 'PRIVATE',
      ]
    );
    await this.replaceIngredients(rows[0].id, data.nguyen_lieu || data.ingredients || []);
    return this.findById({ id: rows[0].id, userId });
  }

  static async update({ id, userId, data }) {
    const existing = await this.findById({ id, userId });
    if (!existing) return null;
    const totalTime = Number(data.thoi_gian_phut || data.time_minutes || existing.thoi_gian_phut || 30);
    await query(
      `UPDATE recipes
       SET name_vi = COALESCE($2, name_vi),
           name_en = COALESCE($3, name_en),
           description = COALESCE($4, description),
           instructions = COALESCE($5, instructions),
           prep_time = $6,
           servings = COALESCE($7, servings),
           is_public = COALESCE($8, is_public),
           updated_at = NOW()
       WHERE id = $1`,
      [
        Number(id),
        data.tieu_de || data.recipe_name || null,
        data.name_en || data.tieu_de || data.recipe_name || null,
        data.mo_ta || data.description || null,
        Array.isArray(data.instructions) ? data.instructions.join('\n') : data.huong_dan || null,
        totalTime,
        data.khau_phan || data.servings || null,
        data.loai_quyen ? data.loai_quyen !== 'PRIVATE' : null,
      ]
    );
    if (data.nguyen_lieu || data.ingredients) await this.replaceIngredients(id, data.nguyen_lieu || data.ingredients);
    return this.findById({ id, userId });
  }

  static async remove({ id, userId }) {
    const result = await query(`DELETE FROM recipes WHERE id = $1 AND (created_by = $2 OR $2 IS NULL)`, [
      Number(id),
      userId ? Number(userId) : null,
    ]);
    return result.rowCount > 0;
  }

  static async addFavorite({ userId, recipeId }) {
    await query(
      `INSERT INTO favorite_recipes (user_id, recipe_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [Number(userId), Number(recipeId)]
    );
  }

  static async removeFavorite({ userId, recipeId }) {
    await query(`DELETE FROM favorite_recipes WHERE user_id = $1 AND recipe_id = $2`, [Number(userId), Number(recipeId)]);
  }

  static async findFavorites({ userId }) {
    const { rows } = await query(
      `SELECT r.*, true AS da_yeu_thich
       FROM favorite_recipes fr
       JOIN recipes r ON r.id = fr.recipe_id
       WHERE fr.user_id = $1
       ORDER BY fr.created_at DESC`,
      [Number(userId)]
    );
    const ingredients = await this.loadIngredients(rows.map((row) => row.id));
    return rows.map((row) => mapRecipe(row, ingredients.get(String(row.id)) || []));
  }

  // The fridge is shared by the whole family, not just the requesting user
  // — aggregate every family member's fridge_items (same household stock)
  // so suggestions/missing-ingredient checks reflect what the family
  // actually has, summing quantities when multiple members hold the same
  // ingredient.
  static async getStock(userId, familyGroupId) {
    const userIds = await FridgeItemModel.getFamilyUserIds(userId, familyGroupId);
    const { rows } = await query(
      `SELECT name, quantity FROM fridge_items WHERE user_id = ANY($1::int[]) AND quantity > 0`,
      [userIds]
    );
    const stock = new Map();
    for (const row of rows) {
      const key = normalizeText(row.name);
      stock.set(key, (stock.get(key) || 0) + Number(row.quantity || 0));
    }
    return stock;
  }

  static async getMissingForRecipe({ recipeId, userId, familyGroupId }) {
    const recipe = await this.findById({ id: recipeId, userId });
    if (!recipe) return null;
    const stock = await this.getStock(userId, familyGroupId);
    const missing = [];
    const available_food_ids = [];
    for (const ing of recipe.nguyen_lieu) {
      const available = stock.get(normalizeText(ing.ten_nguyen_lieu)) || 0;
      const need = Number(ing.so_luong) || 1;
      if (available >= need) available_food_ids.push(ing.thuc_pham_id || `ing-${ing.id}`);
      else missing.push({ food_id: ing.thuc_pham_id || `ing-${ing.id}`, food_name: ing.ten_nguyen_lieu, quantity: need - available, unit: ing.don_vi || 'g' });
    }
    return { recipe, missing, available_food_ids };
  }

  static async getMissingForPlan({ userId, familyGroupId, fromDate, toDate }) {
    // Count how many times each recipe is planned in the range — a recipe
    // cooked 3 times that week needs 3x its ingredients, not just 1x. The
    // previous DISTINCT-recipe_id version collapsed repeats and under-counted.
    const { rows: planItems } = await query(
      `SELECT mpi.recipe_id, COUNT(*)::int AS occurrences
       FROM meal_plan_items mpi
       JOIN meal_plans mp ON mp.id = mpi.meal_plan_id
       WHERE mp.user_id = $1
         AND mpi.meal_date BETWEEN $2 AND $3
       GROUP BY mpi.recipe_id`,
      [Number(userId), fromDate, toDate]
    );
    if (!planItems.length) return [];

    const occurrencesByRecipe = new Map(planItems.map((r) => [Number(r.recipe_id), r.occurrences]));
    const recipeIds = [...occurrencesByRecipe.keys()];

    const { rows: ingredients } = await query(
      `SELECT ri.recipe_id, ri.name, ri.quantity,
              u.symbol AS unit_symbol, u.name AS unit_name
       FROM recipe_ingredients ri
       LEFT JOIN units u ON u.id = ri.unit_id
       WHERE ri.recipe_id = ANY($1::int[])`,
      [recipeIds]
    );
    if (!ingredients.length) return [];

    // Combine by normalized name (case/accent-insensitive) so the same
    // ingredient typed differently across recipes (e.g. "Cà chua" vs "cà
    // chua") still merges into a single line instead of splitting quantities.
    const totals = new Map();
    for (const ing of ingredients) {
      const occurrences = occurrencesByRecipe.get(Number(ing.recipe_id)) || 1;
      const key = normalizeText(ing.name);
      const needed = (Number(ing.quantity) || 0) * occurrences;
      const existing = totals.get(key);
      if (existing) {
        existing.total += needed;
      } else {
        totals.set(key, {
          food_name: ing.name,
          total: needed,
          // Name-first, matching every other unit display in the system
          // ("lít" not its symbol "l").
          unit: ing.unit_name || ing.unit_symbol || 'g',
        });
      }
    }

    // Get fridge stock once
    const stock = await this.getStock(userId, familyGroupId);

    const missing = [];
    for (const [key, ing] of totals) {
      const available = stock.get(key) || 0;
      const needed = ing.total || 1;
      if (available < needed) {
        missing.push({
          food_name: ing.food_name,
          quantity: Number((needed - available).toFixed(2)),
          unit: ing.unit,
        });
      }
    }
    return missing;
  }

  static async suggestFromFridge({ userId, familyGroupId, limit = 20 }) {
    const recipes = await this.findAccessible({ userId, limit, lite: false });
    const suggestions = [];
    for (const recipe of recipes) {
      const result = await this.getMissingForRecipe({ recipeId: recipe.id, userId, familyGroupId });
      suggestions.push({ recipe, available_food_ids: result.available_food_ids, missing: result.missing });
    }
    return suggestions.sort((a, b) => a.missing.length - b.missing.length).slice(0, limit);
  }

  static async deductIngredientsBestEffort({ recipeId, userId, familyGroupId }) {
    const recipe = await this.findById({ id: recipeId, userId });
    if (!recipe) return;
    const familyUserIds = await FridgeItemModel.getFamilyUserIds(userId, familyGroupId);
    for (const ing of recipe.nguyen_lieu) {
      await FridgeItemModel.deductByName({
        actingUserId: userId,
        familyUserIds,
        name: ing.ten_nguyen_lieu,
        quantity: Number(ing.so_luong) || 1,
        recipeId,
      });
    }
  }

  static async markCooked({ recipeId, userId, familyGroupId }) {
    const result = await this.getMissingForRecipe({ recipeId, userId, familyGroupId });
    if (!result) throw new Error('Không tìm thấy công thức');
    if (result.missing.length) throw new Error('Không thể trừ đủ nguyên liệu');
    const familyUserIds = await FridgeItemModel.getFamilyUserIds(userId, familyGroupId);
    for (const ing of result.recipe.nguyen_lieu) {
      await FridgeItemModel.deductByName({
        actingUserId: userId,
        familyUserIds,
        name: ing.ten_nguyen_lieu,
        quantity: Number(ing.so_luong) || 1,
        recipeId,
      });
    }
    // One summary 'cooked' event per cook action (not per ingredient) so
    // cooking directly from the recipe detail page ("Sau khi nấu") counts
    // toward "Công thức phổ biến", same as cooking via the meal plan.
    await FridgeItemModel.recordUsageEvent({
      userId,
      eventType: 'cooked',
      quantity: 1,
      recipeId,
    });
    return { updated: true };
  }

  static async createShoppingListFromRecipe({ recipeId, userId, familyGroupId, title }) {
    const result = await this.getMissingForRecipe({ recipeId, userId, familyGroupId });
    if (!result) throw new Error('Không tìm thấy công thức');
    if (!result.missing.length) throw new Error('Không thiếu nguyên liệu để tạo danh sách mua');
    const list = await ShoppingService.createList({
      userId,
      familyId: familyGroupId,
      listType: 'recipe',
      name: title || `Mua nguyên liệu: ${result.recipe.tieu_de}`,
      items: result.missing.map((row) => ({ food_name: row.food_name, quantity: row.quantity, unit: row.unit })),
    });
    return { shoppingList: list, missing: result.missing };
  }
}

module.exports = RecipeModel;
