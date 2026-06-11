const { query, pool } = require('../config/db');

const LIST_COLUMNS = 'sl.id, sl.user_id, sl.group_id, sl.list_type, sl.name, sl.plan_date, sl.status, sl.assigned_user_id, sl.created_at, sl.updated_at';
const ITEM_COLUMNS = 'sli.id, sli.shopping_list_id, sli.food_id, sli.name, sli.quantity, sli.unit_id, sli.category_id, sli.is_purchased, sli.purchased_by, sli.purchased_at, sli.bought_quantity, sli.remaining_quantity, sli.item_status, sli.inventory_synced_quantity, sli.bought_status, sli.created_at';

class AdminShoppingModel {
  static async list({ search = null, status = null } = {}) {
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(sl.name ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    if (status) {
      params.push(status);
      conditions.push(`sl.status = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT ${LIST_COLUMNS},
              u.full_name AS user_name, u.email AS user_email,
              au.full_name AS assigned_user_name,
              fg.name AS group_name,
              COUNT(sli.id) AS item_count,
              COUNT(sli.id) FILTER (WHERE sli.is_purchased = true) AS purchased_count
       FROM shopping_lists sl
       LEFT JOIN users u ON u.id = sl.user_id
       LEFT JOIN users au ON au.id = sl.assigned_user_id
       LEFT JOIN family_groups fg ON fg.id = sl.group_id
       LEFT JOIN shopping_list_items sli ON sli.shopping_list_id = sl.id
       ${whereClause}
       GROUP BY sl.id, u.full_name, u.email, au.full_name, fg.name
       ORDER BY sl.created_at DESC`,
      params
    );

    return rows.map(AdminShoppingModel._mapList);
  }

  static async getById(id) {
    const { rows } = await query(
      `SELECT ${LIST_COLUMNS},
              u.full_name AS user_name, u.email AS user_email,
              au.full_name AS assigned_user_name,
              fg.name AS group_name
       FROM shopping_lists sl
       LEFT JOIN users u ON u.id = sl.user_id
       LEFT JOIN users au ON au.id = sl.assigned_user_id
       LEFT JOIN family_groups fg ON fg.id = sl.group_id
       WHERE sl.id = $1`,
      [id]
    );
    if (!rows[0]) return null;

    const itemsResult = await query(
      `SELECT ${ITEM_COLUMNS},
              un.name AS unit_name, un.symbol AS unit_symbol,
              fc.name_vi AS category_name_vi, fc.name_en AS category_name_en,
              pu.full_name AS purchased_by_name
       FROM shopping_list_items sli
       LEFT JOIN units un ON un.id = sli.unit_id
       LEFT JOIN food_categories fc ON fc.id = sli.category_id
       LEFT JOIN users pu ON pu.id = sli.purchased_by
       WHERE sli.shopping_list_id = $1
       ORDER BY sli.id ASC`,
      [id]
    );

    const items = itemsResult.rows.map(AdminShoppingModel._mapItem);
    return AdminShoppingModel._mapDetail(rows[0], items);
  }

  static async update(id, { name, status, plan_date, assigned_user_id }) {
    const current = await query(`SELECT * FROM shopping_lists WHERE id = $1`, [id]);
    if (!current.rows[0]) throw new Error('Không tìm thấy danh sách mua sắm.');
    const row = current.rows[0];

    const next = {
      name: name !== undefined && name !== null ? name : row.name,
      status: status !== undefined ? status : row.status,
      plan_date: plan_date !== undefined ? plan_date : row.plan_date,
      assigned_user_id: assigned_user_id !== undefined ? assigned_user_id : row.assigned_user_id,
    };

    await query(
      `UPDATE shopping_lists SET
         name = $1, status = $2, plan_date = $3, assigned_user_id = $4, updated_at = NOW()
       WHERE id = $5`,
      [next.name, next.status, next.plan_date, next.assigned_user_id, id]
    );

    return AdminShoppingModel.getById(id);
  }

  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM shopping_list_items WHERE shopping_list_id = $1`, [id]);
      const { rowCount } = await client.query(`DELETE FROM shopping_lists WHERE id = $1`, [id]);
      if (rowCount === 0) throw new Error('Không tìm thấy danh sách mua sắm.');
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
      await client.query(`DELETE FROM shopping_list_items WHERE shopping_list_id = ANY($1::int[])`, [ids]);
      await client.query(`DELETE FROM shopping_lists WHERE id = ANY($1::int[])`, [ids]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async updateItem(itemId, { is_purchased, item_status, bought_quantity, remaining_quantity }) {
    const current = await query(`SELECT * FROM shopping_list_items WHERE id = $1`, [itemId]);
    if (!current.rows[0]) throw new Error('Không tìm thấy mục mua sắm.');
    const row = current.rows[0];

    const nextIsPurchased = is_purchased !== undefined ? Boolean(is_purchased) : (row.is_purchased === true || row.is_purchased === 't');
    const nextItemStatus = item_status !== undefined ? item_status : row.item_status;
    const nextBoughtQty = bought_quantity !== undefined ? bought_quantity : row.bought_quantity;
    const nextRemainingQty = remaining_quantity !== undefined ? remaining_quantity : row.remaining_quantity;
    const nextPurchasedAt = is_purchased !== undefined
      ? (nextIsPurchased ? (row.purchased_at || new Date()) : null)
      : row.purchased_at;

    await query(
      `UPDATE shopping_list_items SET
         is_purchased = $1, item_status = $2, bought_quantity = $3, remaining_quantity = $4, purchased_at = $5
       WHERE id = $6`,
      [nextIsPurchased, nextItemStatus, nextBoughtQty, nextRemainingQty, nextPurchasedAt, itemId]
    );
  }

  static async deleteItem(itemId) {
    const { rowCount } = await query(`DELETE FROM shopping_list_items WHERE id = $1`, [itemId]);
    if (rowCount === 0) throw new Error('Không tìm thấy mục mua sắm.');
  }

  static async getUsers() {
    const { rows } = await query(`SELECT id, full_name, email FROM users ORDER BY full_name ASC`);
    return rows;
  }

  static _mapList(row) {
    return {
      id: row.id,
      user_id: row.user_id,
      group_id: row.group_id,
      list_type: row.list_type,
      name: row.name,
      plan_date: row.plan_date,
      status: row.status,
      assigned_user_id: row.assigned_user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: row.user_name ?? null,
      user_email: row.user_email ?? null,
      assigned_user_name: row.assigned_user_name ?? null,
      group_name: row.group_name ?? null,
      item_count: Number(row.item_count) || 0,
      purchased_count: Number(row.purchased_count) || 0,
    };
  }

  static _mapDetail(row, items) {
    return {
      ...AdminShoppingModel._mapList(row),
      item_count: items.length,
      purchased_count: items.filter((i) => i.is_purchased).length,
      items,
    };
  }

  static _mapItem(row) {
    return {
      id: row.id,
      shopping_list_id: row.shopping_list_id,
      food_id: row.food_id,
      name: row.name,
      quantity: Number(row.quantity),
      unit_id: row.unit_id,
      category_id: row.category_id,
      is_purchased: row.is_purchased === true || row.is_purchased === 't',
      purchased_by: row.purchased_by,
      purchased_at: row.purchased_at,
      bought_quantity: row.bought_quantity !== null ? Number(row.bought_quantity) : null,
      remaining_quantity: row.remaining_quantity !== null ? Number(row.remaining_quantity) : null,
      item_status: row.item_status,
      inventory_synced_quantity: row.inventory_synced_quantity !== null ? Number(row.inventory_synced_quantity) : null,
      bought_status: row.bought_status === true || row.bought_status === 't',
      created_at: row.created_at,
      unit_name: row.unit_name ?? null,
      unit_symbol: row.unit_symbol ?? null,
      category_name_vi: row.category_name_vi ?? null,
      category_name_en: row.category_name_en ?? null,
      purchased_by_name: row.purchased_by_name ?? null,
    };
  }
}

module.exports = AdminShoppingModel;
