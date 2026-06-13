const { query } = require('../config/db');
const bcrypt = require('bcryptjs');

const USER_COLUMNS = `id, email, full_name, phone, role, is_locked, failed_login_attempts, last_login, created_at, updated_at`;

class AdminUserModel {
  /**
   * List users with optional search, role, lock filters and pagination.
   */
  static async list({ search = null, role = null, locked = null, page = 1, limit = 10 } = {}) {
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`);
    }
    if (role) {
      params.push(role.toLowerCase());
      conditions.push(`LOWER(u.role) = $${params.length}`);
    }
    if (locked !== null && locked !== undefined) {
      params.push(locked === 'true' || locked === true);
      conditions.push(`u.is_locked = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total for pagination
    const countResult = await query(
      `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Paginated result
    params.push(Number(limit));
    params.push(offset);
    const dataResult = await query(
      `SELECT u.${USER_COLUMNS.split(', ').join(', u.')}
       FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1}
       OFFSET $${params.length}`,
      params
    );

    return {
      users: dataResult.rows.map(AdminUserModel._mapUser),
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    };
  }

  /**
   * Get single user by ID.
   */
  static async getById(id) {
    const { rows } = await query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] ? AdminUserModel._mapUser(rows[0]) : null;
  }

  /**
   * Create a new user with hashed password.
   */
  static async create({ full_name, email, phone, password, role = 'USER', is_locked = false }) {
    // Check email uniqueness
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      throw new Error('Email đã tồn tại trong hệ thống.');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, password_plain, role, is_locked)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${USER_COLUMNS}`,
      [full_name, email.toLowerCase(), phone || null, password_hash, password, (role || 'user').toLowerCase(), Boolean(is_locked)]
    );
    return AdminUserModel._mapUser(rows[0]);
  }

  /**
   * Update user details (full_name, email, phone, role, is_locked).
   */
  static async update(id, { full_name, email, phone, role, is_locked }) {
    // Check email uniqueness if changing
    if (email) {
      const existing = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), id]);
      if (existing.rows.length > 0) {
        throw new Error('Email đã tồn tại trong hệ thống.');
      }
    }

    const { rows } = await query(
      `UPDATE users SET
         full_name   = COALESCE($1, full_name),
         email       = COALESCE($2, email),
         phone       = COALESCE($3, phone),
         role        = COALESCE($4, role),
         is_locked   = COALESCE($5, is_locked),
         updated_at  = NOW()
       WHERE id = $6
       RETURNING ${USER_COLUMNS}`,
      [
        full_name || null,
        email ? email.toLowerCase() : null,
        phone || null,
        role ? role.toLowerCase() : null,
        is_locked === undefined ? null : Boolean(is_locked),
        id,
      ]
    );
    if (!rows[0]) throw new Error('Không tìm thấy người dùng.');
    return AdminUserModel._mapUser(rows[0]);
  }

  /**
   * Toggle lock status of a user.
   */
  static async toggleLock(id, requestingAdminId) {
    if (String(id) === String(requestingAdminId)) {
      throw new Error('Không thể tự khóa tài khoản quản trị đang đăng nhập.');
    }

    const { rows } = await query(
      `UPDATE users SET is_locked = NOT is_locked, updated_at = NOW()
       WHERE id = $1
       RETURNING id, is_locked`,
      [id]
    );
    if (!rows[0]) throw new Error('Không tìm thấy người dùng.');
    return rows[0];
  }

  /**
   * Reset a user's password directly.
   */
  static async resetPassword(id, new_password) {
    const password_hash = await bcrypt.hash(new_password, 10);
    const { rowCount } = await query(
      `UPDATE users SET password_hash = $1, password_plain = $2, updated_at = NOW() WHERE id = $3`,
      [password_hash, new_password, id]
    );
    if (rowCount === 0) throw new Error('Không tìm thấy người dùng.');
  }

  /**
   * Delete a single user (cascades via FK).
   */
  static async delete(id, requestingAdminId) {
    if (String(id) === String(requestingAdminId)) {
      throw new Error('Không thể tự xóa tài khoản quản trị đang đăng nhập.');
    }
    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [id]);
    if (rowCount === 0) throw new Error('Không tìm thấy người dùng.');
  }

  /**
   * Bulk delete users (cascades via FK).
   */
  static async bulkDelete(ids, requestingAdminId) {
    if (ids.includes(String(requestingAdminId))) {
      throw new Error('Danh sách xóa chứa tài khoản quản trị đang đăng nhập.');
    }
    await query(
      `DELETE FROM users WHERE id = ANY($1::int[])`,
      [ids]
    );
  }

  static _mapUser(row) {
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      phone: row.phone ?? null,
      role: String(row.role || 'user').toUpperCase(),
      is_locked: row.is_locked === true || row.is_locked === 't',
      failed_login_attempts: row.failed_login_attempts ?? 0,
      last_login: row.last_login,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

module.exports = AdminUserModel;
