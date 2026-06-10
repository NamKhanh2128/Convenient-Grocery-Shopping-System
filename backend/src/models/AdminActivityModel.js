const { query } = require('../config/db');

class AdminActivityModel {
  static async list({ search = null, action_type = null, page = 1, limit = 20 } = {}) {
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.full_name ILIKE $${params.length} OR fg.name ILIKE $${params.length} OR fa.message ILIKE $${params.length})`);
    }
    if (action_type) {
      params.push(action_type.toLowerCase());
      conditions.push(`fa.action_type = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) AS total
       FROM family_activities fa
       LEFT JOIN family_groups fg ON fg.id = fa.family_id
       LEFT JOIN users         u  ON u.id  = fa.user_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Paginated data
    params.push(Number(limit));
    params.push(offset);
    const { rows } = await query(
      `SELECT
         fa.id,
         fa.family_id,
         fg.name       AS family_name,
         fa.user_id,
         u.full_name   AS user_name,
         u.email       AS user_email,
         u.role        AS user_role,
         fa.action_type,
         fa.message,
         fa.target,
         fa.created_at
       FROM family_activities fa
       LEFT JOIN family_groups fg ON fg.id = fa.family_id
       LEFT JOIN users         u  ON u.id  = fa.user_id
       ${whereClause}
       ORDER BY fa.created_at DESC
       LIMIT $${params.length - 1}
       OFFSET $${params.length}`,
      params
    );

    return {
      activities: rows.map(a => ({
        id:          a.id,
        family_id:   String(a.family_id || ''),
        family_name: a.family_name || 'Gia đình ẩn danh',
        user_id:     String(a.user_id || ''),
        user_name:   a.user_name || 'Người dùng ẩn danh',
        user_email:  a.user_email || '—',
        user_role:   a.user_role || 'USER',
        action_type: a.action_type,
        message:     a.message,
        target:      a.target,
        created_at:  a.created_at,
      })),
      total,
    };
  }
}

module.exports = AdminActivityModel;
