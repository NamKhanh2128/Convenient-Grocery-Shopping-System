const { query } = require('../config/db');

// Local Y/M/D parts — avoids the UTC shift from toISOString() that rolls the
// date back a day in timezones ahead of UTC (e.g. UTC+7).
function localYmd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function localMmDd(date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

class StatsModel {
  static async getFamilyUserIds(familyId) {
    const { rows } = await query(
      `SELECT user_id FROM group_members WHERE group_id = $1`,
      [Number(familyId)]
    );
    return rows.map((r) => Number(r.user_id));
  }

  static async getOverview(familyId) {
    const userIds = await this.getFamilyUserIds(familyId);
    const today = localYmd(new Date());

    if (userIds.length === 0) {
      return {
        totalFridgeItems: 0, expiredCount: 0, wastePercentage: 0,
        categoryDistribution: [], activityCount: 0,
        mealPlanCount: 0, shoppingListCount: 0,
      };
    }

    const [fridgeRes, expiredRes, catRes, mealRes, shopRes] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM fridge_items WHERE user_id = ANY($1)`, [userIds]),
      query(`SELECT COUNT(*)::int AS total FROM fridge_items WHERE user_id = ANY($1) AND expiration_date < $2`, [userIds, today]),
      query(`
        SELECT COALESCE(fc.name_vi, 'Khác') AS category, COUNT(fi.id)::int AS count
        FROM fridge_items fi
        LEFT JOIN food_categories fc ON fc.id = fi.category_id
        WHERE fi.user_id = ANY($1)
        GROUP BY fc.name_vi ORDER BY count DESC
      `, [userIds]),
      query(`
        SELECT COUNT(mpi.id)::int AS total
        FROM meal_plan_items mpi
        JOIN meal_plans mp ON mp.id = mpi.meal_plan_id
        WHERE mp.user_id = ANY($1)
      `, [userIds]),
      query(`SELECT COUNT(*)::int AS total FROM shopping_lists WHERE group_id = $1`, [Number(familyId)]),
    ]);

    const total = fridgeRes.rows[0]?.total ?? 0;
    const expired = expiredRes.rows[0]?.total ?? 0;

    return {
      totalFridgeItems: total,
      expiredCount: expired,
      wastePercentage: total > 0 ? Math.round((expired / total) * 100) : 0,
      categoryDistribution: catRes.rows,
      mealPlanCount: mealRes.rows[0]?.total ?? 0,
      shoppingListCount: shopRes.rows[0]?.total ?? 0,
      activityCount: (mealRes.rows[0]?.total ?? 0) + (shopRes.rows[0]?.total ?? 0),
    };
  }

  static async getDailyActivity(familyId) {
    const userIds = await this.getFamilyUserIds(familyId);
    const ids = userIds.length > 0 ? userIds : [0];

    const { rows } = await query(`
      SELECT TO_CHAR(mpi.meal_date, 'MM-DD') AS date, COUNT(mpi.id)::int AS count
      FROM meal_plan_items mpi
      JOIN meal_plans mp ON mp.id = mpi.meal_plan_id
      WHERE mp.user_id = ANY($1)
        AND mpi.meal_date >= CURRENT_DATE - INTERVAL '6 days'
        AND mpi.meal_date <= CURRENT_DATE
      GROUP BY mpi.meal_date
      ORDER BY mpi.meal_date ASC
    `, [ids]);

    const dateMap = {};
    rows.forEach((r) => { dateMap[r.date] = r.count; });

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = localMmDd(d); // MM-DD (local, matches TO_CHAR(meal_date))
      result.push({ date: key, count: dateMap[key] ?? 0 });
    }
    return result;
  }

  static async getCategoryBar(familyId) {
    const userIds = await this.getFamilyUserIds(familyId);
    if (userIds.length === 0) return [];

    const { rows } = await query(`
      SELECT COALESCE(fc.name_vi, 'Khác') AS category, SUM(fi.quantity)::float AS count
      FROM fridge_items fi
      LEFT JOIN food_categories fc ON fc.id = fi.category_id
      WHERE fi.user_id = ANY($1)
      GROUP BY fc.name_vi ORDER BY count DESC
    `, [userIds]);

    return rows.map((r) => ({ category: r.category, count: Number(r.count) }));
  }

  static async getFoodTrends(familyId) {
    const userIds = await this.getFamilyUserIds(familyId);
    if (userIds.length === 0) return { mostUsed: [], leastUsed: [] };

    const [usedRes, leastRes] = await Promise.all([
      // Most used: ingredients appearing most in cooked meal plans
      query(`
        SELECT
          'ing-' || LOWER(ri.name) AS food_id,
          ri.name AS food_name,
          COALESCE(MAX(f.icon), '🍽️') AS icon,
          COALESCE(MAX(fc.name_vi), 'Khác') AS category,
          COUNT(*)::int AS count,
          EXISTS(
            SELECT 1 FROM fridge_items fi2
            WHERE fi2.user_id = ANY($1) AND LOWER(fi2.name) = LOWER(ri.name)
          ) AS in_fridge
        FROM recipe_ingredients ri
        LEFT JOIN foods f ON LOWER(f.food_name) = LOWER(ri.name)
        LEFT JOIN food_categories fc ON fc.id = f.category_id
        JOIN meal_plan_items mpi ON mpi.recipe_id = ri.recipe_id
        JOIN meal_plans mp ON mp.id = mpi.meal_plan_id
        WHERE mp.user_id = ANY($1) AND mpi.is_cooked = true
        GROUP BY ri.name
        ORDER BY count DESC
        LIMIT 6
      `, [userIds]),
      // Least used: fridge items never used in a cooked recipe
      query(`
        SELECT DISTINCT
          'fi-' || fi.id AS food_id,
          fi.name AS food_name,
          COALESCE(f.icon, '🍽️') AS icon,
          COALESCE(fc.name_vi, 'Khác') AS category,
          0 AS count, true AS in_fridge
        FROM fridge_items fi
        LEFT JOIN foods f ON LOWER(f.food_name) = LOWER(fi.name)
        LEFT JOIN food_categories fc ON fc.id = fi.category_id
        WHERE fi.user_id = ANY($1)
          AND NOT EXISTS (
            SELECT 1 FROM recipe_ingredients ri
            JOIN meal_plan_items mpi ON mpi.recipe_id = ri.recipe_id
            JOIN meal_plans mp ON mp.id = mpi.meal_plan_id
            WHERE LOWER(ri.name) = LOWER(fi.name)
              AND mp.user_id = ANY($1)
              AND mpi.is_cooked = true
          )
        LIMIT 6
      `, [userIds]),
    ]);

    const mapFood = (r) => ({
      food_id: String(r.food_id),
      food_name: r.food_name,
      icon: r.icon,
      category: r.category,
      count: Number(r.count),
      inFridge: Boolean(r.in_fridge),
    });

    return {
      mostUsed: usedRes.rows.map(mapFood),
      leastUsed: leastRes.rows.map(mapFood),
    };
  }

  static async getWasteReport(familyId) {
    const userIds = await this.getFamilyUserIds(familyId);
    if (userIds.length === 0) {
      return { expiredItems: [], activeCount: 0, expiredCount: 0, wasteRatio: 0 };
    }

    const today = localYmd(new Date());

    const [expiredRes, activeRes] = await Promise.all([
      query(`
        SELECT fi.id::text AS fridge_item_id,
               fi.name AS food_name,
               COALESCE(f.icon, '🍽️') AS icon,
               fi.quantity::float AS quantity,
               TO_CHAR(fi.expiration_date, 'YYYY-MM-DD') AS expiry_date,
               fi.storage_location AS location
        FROM fridge_items fi
        LEFT JOIN foods f ON LOWER(f.food_name) = LOWER(fi.name)
        WHERE fi.user_id = ANY($1) AND fi.expiration_date < $2
        ORDER BY fi.expiration_date ASC
      `, [userIds, today]),
      query(`SELECT COUNT(*)::int AS total FROM fridge_items WHERE user_id = ANY($1) AND expiration_date >= $2`, [userIds, today]),
    ]);

    const expiredCount = expiredRes.rows.length;
    const activeCount = activeRes.rows[0]?.total ?? 0;
    const total = activeCount + expiredCount;

    return {
      expiredItems: expiredRes.rows.map((r) => ({ ...r, quantity: Number(r.quantity) })),
      activeCount,
      expiredCount,
      wasteRatio: total > 0 ? Math.round((expiredCount / total) * 100) : 0,
    };
  }
}

module.exports = StatsModel;
