const { query } = require('../config/db');

class AdminUnitModel {
  static async list({ search = null } = {}) {
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.symbol ILIKE $${params.length})`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT u.id, u.name, u.symbol,
              COUNT(f.id)::int AS food_count
       FROM units u
       LEFT JOIN foods f ON f.unit_id = u.id
       ${whereClause}
       GROUP BY u.id, u.name, u.symbol
       ORDER BY u.name ASC`,
      params
    );

    return rows.map(AdminUnitModel._map);
  }

  static async getById(id) {
    const { rows } = await query(
      `SELECT u.id, u.name, u.symbol,
              COUNT(f.id)::int AS food_count
       FROM units u
       LEFT JOIN foods f ON f.unit_id = u.id
       WHERE u.id = $1
       GROUP BY u.id, u.name, u.symbol`,
      [id]
    );
    return rows[0] ? AdminUnitModel._map(rows[0]) : null;
  }

  static async create({ name, symbol }) {
    const existing = await query(
      `SELECT id FROM units WHERE name ILIKE $1 OR symbol ILIKE $2`,
      [name.trim(), symbol.trim()]
    );
    if (existing.rows.length > 0) throw new Error('Đơn vị tính này đã tồn tại.');

    const { rows } = await query(
      `INSERT INTO units (name, symbol) VALUES ($1, $2) RETURNING id`,
      [name.trim(), symbol.trim()]
    );
    return AdminUnitModel.getById(rows[0].id);
  }

  static async update(id, { name, symbol }) {
    if (name || symbol) {
      const existing = await query(
        `SELECT id FROM units
         WHERE (name ILIKE $1 OR symbol ILIKE $2) AND id != $3`,
        [(name || '').trim() || '___', (symbol || '').trim() || '___', id]
      );
      if (existing.rows.length > 0) throw new Error('Đơn vị tính này đã tồn tại.');
    }

    const { rowCount } = await query(
      `UPDATE units SET
         name = COALESCE($1, name),
         symbol = COALESCE($2, symbol)
       WHERE id = $3`,
      [name ? name.trim() : null, symbol ? symbol.trim() : null, id]
    );
    if (rowCount === 0) throw new Error('Không tìm thấy đơn vị tính.');
    return AdminUnitModel.getById(id);
  }

  static async delete(id) {
    const refs = await query(`SELECT COUNT(*)::int AS count FROM foods WHERE unit_id = $1`, [id]);
    if (refs.rows[0]?.count > 0) {
      throw new Error('Không thể xóa đơn vị đang được sử dụng bởi thực phẩm.');
    }
    const { rowCount } = await query('DELETE FROM units WHERE id = $1', [id]);
    if (rowCount === 0) throw new Error('Không tìm thấy đơn vị tính.');
  }

  static async bulkDelete(ids) {
    for (const id of ids) {
      await AdminUnitModel.delete(id);
    }
  }

  static _map(row) {
    return {
      id: Number(row.id),
      name: row.name,
      symbol: row.symbol,
      food_count: Number(row.food_count || 0),
    };
  }
}

module.exports = AdminUnitModel;
