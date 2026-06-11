const { query, pool } = require('../config/db');

class AdminFamilyModel {
  static async list({ search = null } = {}) {
    const params = [];
    let whereClause = '';
    if (search) {
      params.push(`%${search}%`);
      whereClause = `WHERE fg.name ILIKE $1 OR CAST(fg.id AS TEXT) ILIKE $1 OR u.full_name ILIKE $1`;
    }

    const { rows } = await query(
      `SELECT
         fg.id,
         fg.name,
         fg.created_by,
         u.full_name               AS creator_name,
         u.email                   AS creator_email,
         COUNT(gm.id)              AS member_count
       FROM family_groups fg
       LEFT JOIN users       u  ON u.id  = fg.created_by
       LEFT JOIN group_members gm ON gm.group_id = fg.id
       ${whereClause}
       GROUP BY fg.id, fg.name, fg.created_by, u.full_name, u.email
       ORDER BY fg.name`,
      params
    );

    return rows.map(AdminFamilyModel._mapFamily);
  }

  static async getMembers(familyId) {
    const { rows } = await query(
      `SELECT
         gm.id,
         gm.user_id,
         u.full_name,
         u.email,
         u.role
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1
       ORDER BY u.full_name`,
      [familyId]
    );
    return rows.map(r => ({
      id: Number(r.id),
      user_id: Number(r.user_id),
      full_name: r.full_name,
      email: r.email,
      role: r.role,
    }));
  }

  static async delete(familyId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get all member user_ids to delete their personal data belonging to this group
      const membersResult = await client.query(
        `SELECT user_id FROM group_members WHERE group_id = $1`,
        [familyId]
      );
      const memberIds = membersResult.rows.map(r => r.user_id);

      // Shopping lists: group_id is the correct FK column
      const slResult = await client.query(
        `SELECT id FROM shopping_lists WHERE group_id = $1`,
        [familyId]
      );
      if (slResult.rows.length > 0) {
        const slIds = slResult.rows.map(r => r.id);
        await client.query(`DELETE FROM shopping_list_items WHERE shopping_list_id = ANY($1::int[])`, [slIds]);
      }
      await client.query(`DELETE FROM shopping_lists WHERE group_id = $1`, [familyId]);

      // meal_plans belong to user_id; delete plans for all members
      if (memberIds.length > 0) {
        const mpResult = await client.query(
          `SELECT id FROM meal_plans WHERE user_id = ANY($1::int[])`,
          [memberIds]
        );
        if (mpResult.rows.length > 0) {
          const mpIds = mpResult.rows.map(r => r.id);
          await client.query(`DELETE FROM meal_plan_items WHERE meal_plan_id = ANY($1::int[])`, [mpIds]);
          await client.query(`DELETE FROM meal_plans WHERE id = ANY($1::int[])`, [mpIds]);
        }

        // fridge_items belong to user_id; delete for all members
        await client.query(`DELETE FROM fridge_items WHERE user_id = ANY($1::int[])`, [memberIds]);
      }

      // Remove group members, then the group itself
      await client.query(`DELETE FROM group_members WHERE group_id = $1`, [familyId]);
      const { rowCount } = await client.query(`DELETE FROM family_groups WHERE id = $1`, [familyId]);
      if (rowCount === 0) throw new Error('Không tìm thấy nhóm gia đình.');
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static _mapFamily(row) {
    return {
      id: Number(row.id),
      name: row.name,
      created_by: Number(row.created_by),
      creator_name: row.creator_name || 'Ẩn danh',
      creator_email: row.creator_email || '—',
      member_count: parseInt(row.member_count, 10) || 0,
    };
  }
}

module.exports = AdminFamilyModel;
