const { query } = require('../config/db');

class AdminFoodModel {
  /**
   * List all foods (catalog) with category and unit resolved.
   */
  static async list({ search = null, category = null } = {}) {
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`f.food_name ILIKE $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`COALESCE(fc.name_vi, 'Khác') = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT
         f.id                            AS food_id,
         f.food_name,
         COALESCE(fc.name_vi, 'Khác')   AS category,
         COALESCE(u.name,    'g')        AS unit,
         COALESCE(f.icon,    '🍽️')      AS icon
       FROM foods f
       LEFT JOIN food_categories fc ON fc.id = f.category_id
       LEFT JOIN units            u  ON u.id  = f.unit_id
       ${whereClause}
       ORDER BY f.food_name`,
      params
    );

    return rows.map(AdminFoodModel._map);
  }

  static async getById(id) {
    const { rows } = await query(
      `SELECT
         f.id                            AS food_id,
         f.food_name,
         COALESCE(fc.name_vi, 'Khác')   AS category,
         COALESCE(u.name,    'g')        AS unit,
         COALESCE(f.icon,    '🍽️')      AS icon
       FROM foods f
       LEFT JOIN food_categories fc ON fc.id = f.category_id
       LEFT JOIN units            u  ON u.id  = f.unit_id
       WHERE f.id = $1`,
      [id]
    );
    return rows[0] ? AdminFoodModel._map(rows[0]) : null;
  }

  /**
   * Resolve category_id from name_vi.
   */
  static async _resolveCategoryId(category) {
    if (!category) return null;
    const { rows } = await query(`SELECT id FROM food_categories WHERE name_vi = $1`, [category]);
    return rows[0]?.id || null;
  }

  /**
   * Resolve unit_id from symbol or name.
   */
  static async _resolveUnitId(unit) {
    if (!unit) return null;
    const { rows } = await query(`SELECT id FROM units WHERE symbol = $1 OR name = $1`, [unit]);
    return rows[0]?.id || null;
  }

  static async create({ food_name, category, unit, icon }) {
    // Uniqueness check
    const existing = await query(`SELECT id FROM foods WHERE food_name ILIKE $1`, [food_name.trim()]);
    if (existing.rows.length > 0) throw new Error('Tên thực phẩm đã tồn tại trong hệ thống.');

    const category_id = await AdminFoodModel._resolveCategoryId(category);
    const unit_id = await AdminFoodModel._resolveUnitId(unit);

    const { rows } = await query(
      `INSERT INTO foods (food_name, category_id, unit_id, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING id AS food_id`,
      [food_name.trim(), category_id, unit_id, icon || '🍽️']
    );
    return AdminFoodModel.getById(rows[0].food_id);
  }

  static async update(id, { food_name, category, unit, icon }) {
    if (food_name) {
      const existing = await query(`SELECT id FROM foods WHERE food_name ILIKE $1 AND id != $2`, [food_name.trim(), id]);
      if (existing.rows.length > 0) throw new Error('Tên thực phẩm đã tồn tại trong hệ thống.');
    }

    const category_id = category ? await AdminFoodModel._resolveCategoryId(category) : undefined;
    const unit_id = unit ? await AdminFoodModel._resolveUnitId(unit) : undefined;

    await query(
      `UPDATE foods SET
         food_name   = COALESCE($1, food_name),
         category_id = COALESCE($2, category_id),
         unit_id     = COALESCE($3, unit_id),
         icon        = COALESCE($4, icon)
       WHERE id = $5`,
      [food_name ? food_name.trim() : null, category_id ?? null, unit_id ?? null, icon || null, id]
    );
    return AdminFoodModel.getById(id);
  }

  static async delete(id) {
    const { rowCount } = await query('DELETE FROM foods WHERE id = $1', [id]);
    if (rowCount === 0) throw new Error('Không tìm thấy thực phẩm.');
  }

  static async bulkDelete(ids) {
    await query('DELETE FROM foods WHERE id = ANY($1::int[])', [ids]);
  }

  static _map(row) {
    return {
      food_id: String(row.food_id),
      food_name: row.food_name,
      category: row.category,
      unit: row.unit,
      icon: row.icon,
    };
  }
}

module.exports = AdminFoodModel;
