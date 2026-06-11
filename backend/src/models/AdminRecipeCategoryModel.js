const { query } = require('../config/db');

class AdminRecipeCategoryModel {
  static async list({ search = null } = {}) {
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(ten_danh_muc ILIKE $${params.length} OR mo_ta ILIKE $${params.length})`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT danh_muc_cong_thuc_id, ten_danh_muc, mo_ta, ngay_tao
       FROM danh_muc_cong_thuc
       ${whereClause}
       ORDER BY ten_danh_muc ASC`,
      params
    );

    return rows.map(AdminRecipeCategoryModel._map);
  }

  static async getById(id) {
    const { rows } = await query(
      `SELECT danh_muc_cong_thuc_id, ten_danh_muc, mo_ta, ngay_tao
       FROM danh_muc_cong_thuc
       WHERE danh_muc_cong_thuc_id = $1`,
      [id]
    );
    return rows[0] ? AdminRecipeCategoryModel._map(rows[0]) : null;
  }

  static async create({ ten_danh_muc, mo_ta }) {
    const existing = await query(
      `SELECT danh_muc_cong_thuc_id FROM danh_muc_cong_thuc WHERE ten_danh_muc ILIKE $1`,
      [ten_danh_muc.trim()]
    );
    if (existing.rows.length > 0) throw new Error('Danh mục công thức này đã tồn tại.');

    const { rows } = await query(
      `INSERT INTO danh_muc_cong_thuc (ten_danh_muc, mo_ta, ngay_tao)
       VALUES ($1, $2, NOW())
       RETURNING danh_muc_cong_thuc_id, ten_danh_muc, mo_ta, ngay_tao`,
      [ten_danh_muc.trim(), mo_ta || null]
    );
    return AdminRecipeCategoryModel._map(rows[0]);
  }

  static async update(id, { ten_danh_muc, mo_ta }) {
    if (ten_danh_muc) {
      const existing = await query(
        `SELECT danh_muc_cong_thuc_id FROM danh_muc_cong_thuc WHERE ten_danh_muc ILIKE $1 AND danh_muc_cong_thuc_id != $2`,
        [ten_danh_muc.trim(), id]
      );
      if (existing.rows.length > 0) throw new Error('Danh mục công thức này đã tồn tại.');
    }

    const { rows } = await query(
      `UPDATE danh_muc_cong_thuc SET
         ten_danh_muc = COALESCE($1, ten_danh_muc),
         mo_ta        = COALESCE($2, mo_ta)
       WHERE danh_muc_cong_thuc_id = $3
       RETURNING danh_muc_cong_thuc_id, ten_danh_muc, mo_ta, ngay_tao`,
      [ten_danh_muc ? ten_danh_muc.trim() : null, mo_ta ?? null, id]
    );
    if (!rows[0]) throw new Error('Không tìm thấy danh mục công thức.');
    return AdminRecipeCategoryModel._map(rows[0]);
  }

  static async delete(id) {
    const { rowCount } = await query(
      `DELETE FROM danh_muc_cong_thuc WHERE danh_muc_cong_thuc_id = $1`,
      [id]
    );
    if (rowCount === 0) throw new Error('Không tìm thấy danh mục công thức.');
  }

  static async bulkDelete(ids) {
    await query(`DELETE FROM danh_muc_cong_thuc WHERE danh_muc_cong_thuc_id = ANY($1::int[])`, [ids]);
  }

  static _map(row) {
    return {
      danh_muc_cong_thuc_id: row.danh_muc_cong_thuc_id,
      ten_danh_muc: row.ten_danh_muc,
      mo_ta: row.mo_ta,
      ngay_tao: row.ngay_tao,
    };
  }
}

module.exports = AdminRecipeCategoryModel;
