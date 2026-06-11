const { query } = require('../config/db');

class AdminStatsModel {
  static async summary() {
    // Run all counts in parallel
    const [
      usersResult,
      adminsResult,
      foodsResult,
      recipesResult,
      familiesResult,
      mealPlansResult,
      activeShoppingResult,
    ] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM users WHERE role = 'USER' AND is_locked = FALSE`),
      query(`SELECT COUNT(*) AS total FROM users WHERE role = 'ADMIN'`),
      query(`SELECT COUNT(*) AS total FROM foods`),
      query(`SELECT COUNT(*) AS total FROM recipes WHERE is_public = TRUE`),
      query(`SELECT COUNT(*) AS total FROM family_groups`),
      query(`SELECT COUNT(*) AS total FROM meal_plans`),
      query(`SELECT COUNT(*) AS total FROM shopping_lists WHERE status = 'active'`),
    ]);

    return {
      totalUsers:     parseInt(usersResult.rows[0]?.total, 10) || 0,
      totalAdmins:    parseInt(adminsResult.rows[0]?.total, 10) || 0,
      totalFoods:     parseInt(foodsResult.rows[0]?.total, 10) || 0,
      totalRecipes:   parseInt(recipesResult.rows[0]?.total, 10) || 0,
      totalFamilies:  parseInt(familiesResult.rows[0]?.total, 10) || 0,
      totalMealPlans: parseInt(mealPlansResult.rows[0]?.total, 10) || 0,
      activeShopping: parseInt(activeShoppingResult.rows[0]?.total, 10) || 0,
    };
  }

  static async mealsByDay() {
    // Meal plan item count per day for last 7 days — uses meal_plan_items (schema table)
    const { rows } = await query(`
      SELECT
        TO_CHAR(DATE_TRUNC('day', meal_date::timestamp AT TIME ZONE 'UTC'), 'DD/MM') AS date,
        COUNT(*) AS count
      FROM meal_plan_items
      WHERE meal_date >= (CURRENT_DATE - INTERVAL '6 days')
      GROUP BY DATE_TRUNC('day', meal_date::timestamp AT TIME ZONE 'UTC')
      ORDER BY DATE_TRUNC('day', meal_date::timestamp AT TIME ZONE 'UTC') ASC
    `);

    // Build full 7-day series with zeros for missing days
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }).replace('/', '/');
      const found = rows.find(r => r.date === label);
      result.push({ date: label, count: found ? parseInt(found.count, 10) : 0 });
    }
    return result;
  }

  static async foodsByCategory() {
    const { rows } = await query(`
      SELECT
        COALESCE(fc.name_vi, 'Khác') AS name,
        COUNT(f.id)                  AS value
      FROM foods f
      LEFT JOIN food_categories fc ON fc.id = f.category_id
      GROUP BY fc.name_vi
      ORDER BY value DESC
    `);
    return rows.map(r => ({ name: r.name, value: parseInt(r.value, 10) }));
  }

  static async topRecipes() {
    const { rows } = await query(`
      SELECT
        COALESCE(r.name_vi, r.name_en, 'Không tên') AS name,
        COUNT(mpi.id) AS count
      FROM meal_plan_items mpi
      JOIN recipes r ON r.id = mpi.recipe_id
      GROUP BY r.id, r.name_vi, r.name_en
      ORDER BY count DESC
      LIMIT 5
    `);
    return rows.map(r => ({ name: r.name, count: parseInt(r.count, 10) }));
  }

  static async getFamilies() {
    const { rows } = await query(`
      SELECT
        fg.id,
        fg.name,
        fg.created_by,
        u.full_name               AS creator_name,
        u.email                   AS creator_email,
        COUNT(gm.id)              AS member_count
      FROM family_groups fg
      LEFT JOIN users        u  ON u.id  = fg.created_by
      LEFT JOIN group_members gm ON gm.group_id = fg.id
      GROUP BY fg.id, u.full_name, u.email
      ORDER BY fg.name
    `);
    return rows.map(r => ({
      id:            Number(r.id),
      name:          r.name,
      created_by:    Number(r.created_by),
      creator_name:  r.creator_name || 'Ẩn danh',
      creator_email: r.creator_email || '—',
      member_count:  parseInt(r.member_count, 10) || 0,
    }));
  }
}

module.exports = AdminStatsModel;
