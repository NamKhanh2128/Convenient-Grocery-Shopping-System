const { query } = require('../config/db');

/**
 * AdminNotificationModel
 * Operates exclusively on the `notifications` table as defined in
 * database/supabase/database-schema.md.
 *
 * Schema columns used:
 *   id, user_id, type, title, message, is_read, related_id, created_at
 */

const NOTIF_COLUMNS = `
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.message,
  n.is_read,
  n.related_id,
  n.created_at,
  u.full_name AS user_name,
  u.email    AS user_email
`;

class AdminNotificationModel {
  /**
   * List notifications with optional search, type filter, is_read filter, pagination.
   */
  static async list({ search = null, type = null, is_read = null, limit = 50, offset = 0 } = {}) {
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(n.title ILIKE $${idx} OR n.message ILIKE $${idx} OR u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`);
    }
    if (type) {
      params.push(type);
      conditions.push(`n.type = $${params.length}`);
    }
    if (is_read !== null && is_read !== undefined) {
      params.push(is_read === 'true' || is_read === true);
      conditions.push(`n.is_read = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query for pagination
    const countResult = await query(
      `SELECT COUNT(*) AS total
       FROM notifications n
       LEFT JOIN users u ON u.id = n.user_id
       ${whereClause}`,
      params
    );
    const total = Number(countResult.rows[0]?.total ?? 0);

    // Data query
    params.push(Number(limit));
    params.push(Number(offset));
    const { rows } = await query(
      `SELECT ${NOTIF_COLUMNS}
       FROM notifications n
       LEFT JOIN users u ON u.id = n.user_id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return { notifications: rows.map(AdminNotificationModel._map), total };
  }

  /**
   * Get a single notification by id.
   */
  static async getById(id) {
    const { rows } = await query(
      `SELECT ${NOTIF_COLUMNS}
       FROM notifications n
       LEFT JOIN users u ON u.id = n.user_id
       WHERE n.id = $1`,
      [id]
    );
    return rows[0] ? AdminNotificationModel._map(rows[0]) : null;
  }

  /**
   * Mark a single notification as read.
   */
  static async markAsRead(id) {
    const { rows } = await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!rows[0]) throw new Error('Không tìm thấy thông báo.');
    return AdminNotificationModel.getById(id);
  }

  /**
   * Mark multiple notifications as read.
   */
  static async bulkMarkAsRead(ids) {
    if (!ids || ids.length === 0) return;
    await query(
      `UPDATE notifications SET is_read = true WHERE id = ANY($1::int[])`,
      [ids]
    );
  }

  /**
   * Mark all notifications as read (optionally scoped to a user_id).
   */
  static async markAllAsRead(user_id = null) {
    if (user_id) {
      await query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [user_id]);
    } else {
      await query(`UPDATE notifications SET is_read = true`);
    }
  }

  /**
   * Delete a single notification.
   */
  static async delete(id) {
    const { rowCount } = await query(`DELETE FROM notifications WHERE id = $1`, [id]);
    if (rowCount === 0) throw new Error('Không tìm thấy thông báo.');
  }

  /**
   * Bulk delete notifications by id array.
   */
  static async bulkDelete(ids) {
    if (!ids || ids.length === 0) return;
    await query(`DELETE FROM notifications WHERE id = ANY($1::int[])`, [ids]);
  }

  /**
   * Map a DB row to a clean DTO using only schema-defined columns.
   */
  static _map(row) {
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      is_read: row.is_read === true || row.is_read === 't',
      related_id: row.related_id ?? null,
      created_at: row.created_at,
      // joined display fields (not schema columns — for admin UI only)
      user_name: row.user_name ?? null,
      user_email: row.user_email ?? null,
    };
  }
}

module.exports = AdminNotificationModel;
