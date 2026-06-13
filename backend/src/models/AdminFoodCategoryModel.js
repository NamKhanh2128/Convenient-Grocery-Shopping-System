const { query } = require('../config/db');

class AdminFoodCategoryModel {
  static async list({ search = null } = {}) {
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(fc.name_vi ILIKE $${params.length} OR fc.name_en ILIKE $${params.length} OR fc.description ILIKE $${params.length})`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT fc.id, fc.name_vi, fc.name_en, fc.description,
              COUNT(f.id)::int AS food_count
       FROM food_categories fc
       LEFT JOIN foods f ON f.category_id = fc.id
       ${whereClause}
       GROUP BY fc.id, fc.name_vi, fc.name_en, fc.description
       ORDER BY fc.name_vi ASC`,
      params
    );

    return rows.map(AdminFoodCategoryModel._map);
  }

  static async getById(id) {
    const { rows } = await query(
      `SELECT fc.id, fc.name_vi, fc.name_en, fc.description,
              COUNT(f.id)::int AS food_count
       FROM food_categories fc
       LEFT JOIN foods f ON f.category_id = fc.id
       WHERE fc.id = $1
       GROUP BY fc.id, fc.name_vi, fc.name_en, fc.description`,
      [id]
    );
    return rows[0] ? AdminFoodCategoryModel._map(rows[0]) : null;
  }

  static async create({ name_vi, name_en, description }) {
    const existing = await query(
      `SELECT id FROM food_categories WHERE name_vi ILIKE $1 OR name_en ILIKE $2`,
      [name_vi.trim(), (name_en || name_vi).trim()]
    );
    if (existing.rows.length > 0) throw new Error('Danh mục thực phẩm này đã tồn tại.');

    const { rows } = await query(
      `INSERT INTO food_categories (name_vi, name_en, description)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name_vi.trim(), (name_en || name_vi).trim(), description || null]
    );
    return AdminFoodCategoryModel.getById(rows[0].id);
  }

  static async update(id, { name_vi, name_en, description }) {
    if (name_vi || name_en) {
      const existing = await query(
        `SELECT id FROM food_categories
         WHERE (name_vi ILIKE $1 OR name_en ILIKE $2) AND id != $3`,
        [(name_vi || '').trim() || '___', (name_en || name_vi || '').trim() || '___', id]
      );
      if (existing.rows.length > 0) throw new Error('Danh mục thực phẩm này đã tồn tại.');
    }

    const { rowCount } = await query(
      `UPDATE food_categories SET
         name_vi = COALESCE($1, name_vi),
         name_en = COALESCE($2, name_en),
         description = COALESCE($3, description)
       WHERE id = $4`,
      [
        name_vi ? name_vi.trim() : null,
        name_en ? name_en.trim() : null,
        description ?? null,
        id,
      ]
    );
    if (rowCount === 0) throw new Error('Không tìm thấy danh mục thực phẩm.');
    return AdminFoodCategoryModel.getById(id);
  }

  static async delete(id) {
    const refs = await query(`SELECT COUNT(*)::int AS count FROM foods WHERE category_id = $1`, [id]);
    if (refs.rows[0]?.count > 0) {
      throw new Error('Không thể xóa danh mục đang được sử dụng bởi thực phẩm.');
    }
    const { rowCount } = await query('DELETE FROM food_categories WHERE id = $1', [id]);
    if (rowCount === 0) throw new Error('Không tìm thấy danh mục thực phẩm.');
  }

  static async bulkDelete(ids) {
    for (const id of ids) {
      await AdminFoodCategoryModel.delete(id);
    }
  }

  static _map(row) {
    return {
      id: Number(row.id),
      name_vi: row.name_vi,
      name_en: row.name_en,
      description: row.description,
      food_count: Number(row.food_count || 0),
    };
  }
}

module.exports = AdminFoodCategoryModel;
