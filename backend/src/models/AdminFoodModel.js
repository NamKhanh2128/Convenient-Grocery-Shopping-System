const { query } = require('../config/db');

class AdminFoodModel {
  /**
   * List all foods (catalog) with category and unit resolved.
   */
  static async list({ search = null, category_id = null } = {}) {
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`f.food_name ILIKE $${params.length}`);
    }
    if (category_id) {
      params.push(Number(category_id));
      conditions.push(`f.category_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT
         f.id,
         f.food_name,
         f.unit_id,
         f.category_id,
         f.created_at,
         COALESCE(f.icon,    '🍽️')      AS icon,
         fc.name_vi                      AS category_name_vi,
         fc.name_en                      AS category_name_en,
         u.name                          AS unit_name,
         u.symbol                        AS unit_symbol
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
         f.id,
         f.food_name,
         f.unit_id,
         f.category_id,
         f.created_at,
         COALESCE(f.icon,    '🍽️')      AS icon,
         fc.name_vi                      AS category_name_vi,
         fc.name_en                      AS category_name_en,
         u.name                          AS unit_name,
         u.symbol                        AS unit_symbol
       FROM foods f
       LEFT JOIN food_categories fc ON fc.id = f.category_id
       LEFT JOIN units            u  ON u.id  = f.unit_id
       WHERE f.id = $1`,
      [id]
    );
    return rows[0] ? AdminFoodModel._map(rows[0]) : null;
  }

  static async create({ food_name, category_id, unit_id, icon }) {
    // Uniqueness check
    const existing = await query(`SELECT id FROM foods WHERE food_name ILIKE $1`, [food_name.trim()]);
    if (existing.rows.length > 0) throw new Error('Tên thực phẩm đã tồn tại trong hệ thống.');

    const { rows } = await query(
      `INSERT INTO foods (food_name, category_id, unit_id, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [food_name.trim(), Number(category_id), Number(unit_id), icon || '🍽️']
    );
    return AdminFoodModel.getById(rows[0].id);
  }

  static async update(id, { food_name, category_id, unit_id, icon }) {
    if (food_name) {
      const existing = await query(`SELECT id FROM foods WHERE food_name ILIKE $1 AND id != $2`, [food_name.trim(), id]);
      if (existing.rows.length > 0) throw new Error('Tên thực phẩm đã tồn tại trong hệ thống.');
    }

    await query(
      `UPDATE foods SET
         food_name   = COALESCE($1, food_name),
         category_id = COALESCE($2, category_id),
         unit_id     = COALESCE($3, unit_id),
         icon        = COALESCE($4, icon)
       WHERE id = $5`,
      [
        food_name ? food_name.trim() : null,
        category_id !== undefined && category_id !== null ? Number(category_id) : null,
        unit_id !== undefined && unit_id !== null ? Number(unit_id) : null,
        icon || null,
        id
      ]
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
    if (!row) return null;
    return {
      id: Number(row.id),
      food_name: row.food_name,
      unit_id: row.unit_id ? Number(row.unit_id) : null,
      category_id: row.category_id ? Number(row.category_id) : null,
      icon: row.icon,
      created_at: row.created_at,
      category_name_vi: row.category_name_vi ?? null,
      category_name_en: row.category_name_en ?? null,
      unit_name: row.unit_name ?? null,
      unit_symbol: row.unit_symbol ?? null,
    };
  }
}

module.exports = AdminFoodModel;
