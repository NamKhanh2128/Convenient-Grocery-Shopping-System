const { query, pool } = require('../config/db');

const PLAN_COLUMNS = 'mp.id, mp.user_id, mp.plan_type, mp.start_date, mp.end_date, mp.status, mp.created_at, mp.updated_at';
const ITEM_COLUMNS = 'mpi.id, mpi.meal_plan_id, mpi.recipe_id, mpi.meal_date, mpi.meal_type, mpi.is_cooked, mpi.created_at';

class AdminMealPlanModel {
  static async list({ search = null, status = null } = {}) {
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    if (status) {
      params.push(status);
      conditions.push(`mp.status = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT ${PLAN_COLUMNS},
              u.full_name AS user_name, u.email AS user_email,
              COUNT(mpi.id) AS item_count,
              COUNT(mpi.id) FILTER (WHERE mpi.is_cooked = true) AS cooked_count
       FROM meal_plans mp
       LEFT JOIN users u ON u.id = mp.user_id
       LEFT JOIN meal_plan_items mpi ON mpi.meal_plan_id = mp.id
       ${whereClause}
       GROUP BY mp.id, u.full_name, u.email
       ORDER BY mp.created_at DESC`,
      params
    );

    return rows.map(AdminMealPlanModel._mapPlan);
  }

  static async getById(id) {
    const { rows } = await query(
      `SELECT ${PLAN_COLUMNS},
              u.full_name AS user_name, u.email AS user_email
       FROM meal_plans mp
       LEFT JOIN users u ON u.id = mp.user_id
       WHERE mp.id = $1`,
      [id]
    );
    if (!rows[0]) return null;

    const itemsResult = await query(
      `SELECT ${ITEM_COLUMNS},
              COALESCE(r.name_vi, r.name_en) AS recipe_name
       FROM meal_plan_items mpi
       LEFT JOIN recipes r ON r.id = mpi.recipe_id
       WHERE mpi.meal_plan_id = $1
       ORDER BY mpi.meal_date ASC, mpi.id ASC`,
      [id]
    );

    const items = itemsResult.rows.map(AdminMealPlanModel._mapItem);
    return AdminMealPlanModel._mapDetail(rows[0], items);
  }

  static async update(id, { plan_type, start_date, end_date, status }) {
    const current = await query(`SELECT * FROM meal_plans WHERE id = $1`, [id]);
    if (!current.rows[0]) throw new Error('Không tìm thấy kế hoạch bữa ăn.');
    const row = current.rows[0];

    const next = {
      plan_type: plan_type !== undefined && plan_type !== null ? plan_type : row.plan_type,
      start_date: start_date !== undefined && start_date !== null ? start_date : row.start_date,
      end_date: end_date !== undefined && end_date !== null ? end_date : row.end_date,
      status: status !== undefined ? status : row.status,
    };

    await query(
      `UPDATE meal_plans SET
         plan_type = $1, start_date = $2, end_date = $3, status = $4, updated_at = NOW()
       WHERE id = $5`,
      [next.plan_type, next.start_date, next.end_date, next.status, id]
    );

    return AdminMealPlanModel.getById(id);
  }

  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM meal_plan_items WHERE meal_plan_id = $1`, [id]);
      const { rowCount } = await client.query(`DELETE FROM meal_plans WHERE id = $1`, [id]);
      if (rowCount === 0) throw new Error('Không tìm thấy kế hoạch bữa ăn.');
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
      await client.query(`DELETE FROM meal_plan_items WHERE meal_plan_id = ANY($1::int[])`, [ids]);
      await client.query(`DELETE FROM meal_plans WHERE id = ANY($1::int[])`, [ids]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async updateItem(itemId, { is_cooked, meal_date, meal_type, recipe_id }) {
    const current = await query(`SELECT * FROM meal_plan_items WHERE id = $1`, [itemId]);
    if (!current.rows[0]) throw new Error('Không tìm thấy mục kế hoạch bữa ăn.');
    const row = current.rows[0];

    const next = {
      is_cooked: is_cooked !== undefined ? Boolean(is_cooked) : (row.is_cooked === true || row.is_cooked === 't'),
      meal_date: meal_date !== undefined && meal_date !== null ? meal_date : row.meal_date,
      meal_type: meal_type !== undefined && meal_type !== null ? meal_type : row.meal_type,
      recipe_id: recipe_id !== undefined && recipe_id !== null ? Number(recipe_id) : row.recipe_id,
    };

    await query(
      `UPDATE meal_plan_items SET
         is_cooked = $1, meal_date = $2, meal_type = $3, recipe_id = $4
       WHERE id = $5`,
      [next.is_cooked, next.meal_date, next.meal_type, next.recipe_id, itemId]
    );
  }

  static async deleteItem(itemId) {
    const { rowCount } = await query(`DELETE FROM meal_plan_items WHERE id = $1`, [itemId]);
    if (rowCount === 0) throw new Error('Không tìm thấy mục kế hoạch bữa ăn.');
  }

  static async getUsers() {
    const { rows } = await query(`SELECT id, full_name, email FROM users ORDER BY full_name ASC`);
    return rows;
  }

  static async getRecipes() {
    const { rows } = await query(`SELECT id, name_vi, name_en FROM recipes ORDER BY name_vi ASC`);
    return rows;
  }

  static _mapPlan(row) {
    return {
      id: row.id,
      user_id: row.user_id,
      plan_type: row.plan_type,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: row.user_name ?? null,
      user_email: row.user_email ?? null,
      item_count: Number(row.item_count) || 0,
      cooked_count: Number(row.cooked_count) || 0,
    };
  }

  static _mapDetail(row, items) {
    return {
      ...AdminMealPlanModel._mapPlan(row),
      item_count: items.length,
      cooked_count: items.filter((i) => i.is_cooked).length,
      items,
    };
  }

  static _mapItem(row) {
    return {
      id: row.id,
      meal_plan_id: row.meal_plan_id,
      recipe_id: row.recipe_id,
      meal_date: row.meal_date,
      meal_type: row.meal_type,
      is_cooked: row.is_cooked === true || row.is_cooked === 't',
      created_at: row.created_at,
      recipe_name: row.recipe_name ?? null,
    };
  }
}

module.exports = AdminMealPlanModel;
