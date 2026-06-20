const { query } = require('../config/db');

// Local Y/M/D parts — avoids the UTC shift from toISOString() that rolls the
// date back a day in timezones ahead of UTC (e.g. UTC+7).
function localYmd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function localMmDd(date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Monday-Sunday week containing today, shifted by weekOffset weeks (0 = this
// week, -1 = previous week, 1 = next week...). Shared by every "for this
// week" stat so they all agree on the same date range.
function getWeekRange(weekOffset = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek) + Number(weekOffset || 0) * 7;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + diffToMonday);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
  return { days, from: localYmd(days[0]), to: localYmd(days[6]) };
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

  // "Tiêu thụ theo danh mục" — actual consumption (food_usage_events
  // event_type='used', logged by FridgeItemModel on "Dùng" and on recipe
  // cooking deductions), NOT current fridge stock. Excludes the per-cook
  // 'cooked' summary events, which carry no real ingredient quantity.
  //
  // Counts usage EVENTS (lần sử dụng), not summed quantity: items within the
  // same category use different units (kg, g, quả, củ, gói...), so adding
  // their raw quantities together — even with a unit label slapped on —
  // would still be meaningless/wrong. Counting occurrences is unit-agnostic
  // and the unit is always valid: "lần".
  static async getCategoryBar(familyId) {
    const userIds = await this.getFamilyUserIds(familyId);
    if (userIds.length === 0) return [];

    const { rows } = await query(`
      SELECT COALESCE(fc.name_vi, 'Khác') AS category, COUNT(*)::int AS count
      FROM food_usage_events fue
      LEFT JOIN foods f ON f.id = fue.food_id
      LEFT JOIN food_categories fc ON fc.id = f.category_id
      WHERE fue.user_id = ANY($1) AND fue.event_type = 'used'
      GROUP BY fc.name_vi ORDER BY count DESC
    `, [userIds]);

    return rows.map((r) => ({ category: r.category, count: Number(r.count) }));
  }

  // "Thực phẩm đã mua theo thời gian" — number of PRODUCTS purchased per day
  // in a given week (Monday-Sunday), broken down by category. Items are
  // measured in different units (kg, quả, gói, lít...), so summing their
  // quantities into one number would be meaningless — counting items per
  // category instead is unit-agnostic AND tells you *what kind* of food was
  // bought each day, not just an anonymous total.
  //
  // weekOffset: 0 = the week containing today, -1 = previous week, 1 = next
  // week, etc. — lets the UI page through past weeks instead of only ever
  // showing the last 7 days.
  static async getPurchaseTrend(familyId, weekOffset = 0) {
    const categoriesRes = await query(`SELECT name_vi FROM food_categories ORDER BY id`);
    const categories = categoriesRes.rows.map((r) => r.name_vi);

    const { days: weekDays, from: fromDate, to: toDate } = getWeekRange(weekOffset);

    const { rows } = await query(`
      SELECT TO_CHAR(sli.purchased_at, 'MM-DD') AS date,
             COALESCE(fc.name_vi, 'Khác') AS category,
             COUNT(*)::int AS count
      FROM shopping_list_items sli
      JOIN shopping_lists sl ON sl.id = sli.shopping_list_id
      LEFT JOIN food_categories fc ON fc.id = sli.category_id
      WHERE sl.group_id = $1
        AND sli.purchased_at IS NOT NULL
        AND sli.purchased_at::date BETWEEN $2 AND $3
      GROUP BY TO_CHAR(sli.purchased_at, 'MM-DD'), fc.name_vi
    `, [Number(familyId), fromDate, toDate]);

    const byDate = new Map();
    rows.forEach((r) => {
      if (!byDate.has(r.date)) byDate.set(r.date, {});
      byDate.get(r.date)[r.category] = r.count;
    });

    const result = [];
    for (const d of weekDays) {
      const key = localMmDd(d);
      const dayCategories = byDate.get(key) || {};
      const entry = { date: key, total: 0 };
      for (const cat of categories) {
        entry[cat] = dayCategories[cat] ?? 0;
        entry.total += entry[cat];
      }
      result.push(entry);
    }
    return { categories, days: result, from: fromDate, to: toDate };
  }

  // "Thực phẩm đã mua" for the same week as getPurchaseTrend, broken down by
  // individual food (not category) — how much of each specific food was
  // actually bought (sli.bought_quantity), in its own unit.
  static async getPurchaseTrendByFood(familyId, weekOffset = 0) {
    const { from: fromDate, to: toDate } = getWeekRange(weekOffset);

    const { rows } = await query(`
      SELECT COALESCE(f.food_name, sli.name) AS food_name,
             COALESCE(f.icon, '🧺') AS icon,
             COALESCE(fc.name_vi, 'Khác') AS category,
             COALESCE(u.name, 'miếng') AS unit,
             SUM(sli.bought_quantity)::float AS total_quantity,
             COUNT(*)::int AS event_count
      FROM shopping_list_items sli
      JOIN shopping_lists sl ON sl.id = sli.shopping_list_id
      LEFT JOIN foods f ON f.id = sli.food_id
      LEFT JOIN food_categories fc ON fc.id = COALESCE(f.category_id, sli.category_id)
      LEFT JOIN units u ON u.id = COALESCE(sli.unit_id, f.unit_id)
      WHERE sl.group_id = $1
        AND sli.purchased_at IS NOT NULL
        AND sli.purchased_at::date BETWEEN $2 AND $3
      GROUP BY COALESCE(f.food_name, sli.name), f.icon, fc.name_vi, u.name
      ORDER BY total_quantity DESC
      LIMIT 15
    `, [Number(familyId), fromDate, toDate]);

    return rows.map((r) => ({ ...r, total_quantity: Number(r.total_quantity) }));
  }

  // "Thực phẩm trong tủ theo từng loại" — current fridge stock broken down
  // by individual food (not category), with the actual quantity + its own
  // unit, complementing the category-level "Phân loại thực phẩm" pie chart.
  static async getFridgeStockByFood(familyId) {
    const userIds = await this.getFamilyUserIds(familyId);
    if (userIds.length === 0) return [];

    const { rows } = await query(`
      SELECT fi.name AS food_name,
             COALESCE(f.icon, '🍽️') AS icon,
             COALESCE(fc.name_vi, 'Khác') AS category,
             COALESCE(u.name, 'miếng') AS unit,
             SUM(fi.quantity)::float AS total_quantity
      FROM fridge_items fi
      LEFT JOIN foods f ON LOWER(f.food_name) = LOWER(fi.name)
      LEFT JOIN food_categories fc ON fc.id = fi.category_id
      LEFT JOIN units u ON u.id = fi.unit_id
      WHERE fi.user_id = ANY($1)
      GROUP BY fi.name, f.icon, fc.name_vi, u.name
      ORDER BY total_quantity DESC
      LIMIT 15
    `, [userIds]);

    return rows.map((r) => ({ ...r, total_quantity: Number(r.total_quantity) }));
  }

  // "Tiêu thụ theo thực phẩm" — actual quantity consumed per food (e.g.
  // "Cà chua: 1.5 kg", "Trứng gà: 6 quả") over the last 30 days, instead of
  // an anonymous event count. Each food has its own consistent unit, so
  // summing its own quantity (unlike summing across a mixed-unit category)
  // is meaningful here.
  static async getConsumptionByFood(familyId, days = 30) {
    const userIds = await this.getFamilyUserIds(familyId);
    if (userIds.length === 0) return [];

    const { rows } = await query(`
      SELECT COALESCE(f.food_name, 'Thực phẩm khác') AS food_name,
             COALESCE(f.icon, '🍽️') AS icon,
             COALESCE(fc.name_vi, 'Khác') AS category,
             COALESCE(u.name, 'miếng') AS unit,
             SUM(fue.quantity)::float AS total_quantity,
             COUNT(*)::int AS event_count
      FROM food_usage_events fue
      LEFT JOIN foods f ON f.id = fue.food_id
      LEFT JOIN food_categories fc ON fc.id = f.category_id
      LEFT JOIN units u ON u.id = fue.unit_id
      WHERE fue.user_id = ANY($1) AND fue.event_type = 'used'
        AND fue.created_at >= NOW() - INTERVAL '${Number(days) || 30} days'
      GROUP BY f.food_name, f.icon, fc.name_vi, u.name
      ORDER BY total_quantity DESC
      LIMIT 15
    `, [userIds]);

    return rows.map((r) => ({ ...r, total_quantity: Number(r.total_quantity) }));
  }

  // "Lãng phí theo thực phẩm" — actual quantity wasted per food over the
  // last 30 days, combining explicit "Xóa" throw-away events with food still
  // sitting expired in the fridge (not yet removed) — the same two sources
  // getWasteReport's wasteRatio already counts, merged here by food name +
  // unit so e.g. "Cà rốt" wasted both ways shows as one total instead of two.
  static async getWasteByFood(familyId, days = 30) {
    const userIds = await this.getFamilyUserIds(familyId);
    if (userIds.length === 0) return [];

    const [wastedRows, expiredRows] = await Promise.all([
      query(`
        SELECT COALESCE(f.food_name, 'Thực phẩm khác') AS food_name,
               COALESCE(f.icon, '🍽️') AS icon,
               COALESCE(fc.name_vi, 'Khác') AS category,
               COALESCE(u.name, 'miếng') AS unit,
               SUM(fue.quantity)::float AS total_quantity
        FROM food_usage_events fue
        LEFT JOIN foods f ON f.id = fue.food_id
        LEFT JOIN food_categories fc ON fc.id = f.category_id
        LEFT JOIN units u ON u.id = fue.unit_id
        WHERE fue.user_id = ANY($1) AND fue.event_type = 'wasted'
          AND fue.created_at >= NOW() - INTERVAL '${Number(days) || 30} days'
        GROUP BY f.food_name, f.icon, fc.name_vi, u.name
      `, [userIds]),
      query(`
        SELECT fi.name AS food_name,
               COALESCE(f.icon, '🍽️') AS icon,
               COALESCE(fc.name_vi, 'Khác') AS category,
               COALESCE(u.name, 'miếng') AS unit,
               SUM(fi.quantity)::float AS total_quantity
        FROM fridge_items fi
        LEFT JOIN foods f ON LOWER(f.food_name) = LOWER(fi.name)
        LEFT JOIN food_categories fc ON fc.id = fi.category_id
        LEFT JOIN units u ON u.id = fi.unit_id
        WHERE fi.user_id = ANY($1) AND fi.expiration_date < CURRENT_DATE
        GROUP BY fi.name, f.icon, fc.name_vi, u.name
      `, [userIds]),
    ]);

    const merged = new Map();
    for (const r of [...wastedRows.rows, ...expiredRows.rows]) {
      const key = `${String(r.food_name).toLowerCase()}::${r.unit}`;
      const existing = merged.get(key);
      if (existing) existing.total_quantity += Number(r.total_quantity);
      else merged.set(key, { food_name: r.food_name, icon: r.icon, category: r.category, unit: r.unit, total_quantity: Number(r.total_quantity) });
    }
    return [...merged.values()].sort((a, b) => b.total_quantity - a.total_quantity).slice(0, 15);
  }

  // "Danh sách mua sắm" breakdown — how many lists were created in total,
  // how many got fully bought ('completed'), how many are still in progress
  // ('active'), how many were cancelled, and what fraction of all lists
  // ever created reached completion.
  static async getShoppingListStats(familyId) {
    const { rows } = await query(
      `SELECT status, COUNT(*)::int AS count FROM shopping_lists WHERE group_id = $1 GROUP BY status`,
      [Number(familyId)]
    );
    const byStatus = {};
    rows.forEach((r) => { byStatus[r.status] = r.count; });
    const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
    const completed = byStatus.completed || 0;
    const active = byStatus.active || 0;
    const cancelled = byStatus.cancelled || 0;

    return {
      total,
      completed,
      active,
      cancelled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  static async getFoodTrends(familyId) {
    const userIds = await this.getFamilyUserIds(familyId);
    if (userIds.length === 0) return { mostUsed: [], leastUsed: [] };

    const [usedRes, leastRes] = await Promise.all([
      // Most used: foods with the most 'used' events (consumed via "Dùng" or
      // recipe cooking — see FridgeItemModel.deductByName / updateQuantity).
      query(`
        SELECT
          COALESCE(fue.food_id::text, 'fi-' || MIN(fue.fridge_item_id)) AS food_id,
          COALESCE(f.food_name, 'Thực phẩm khác') AS food_name,
          COALESCE(f.icon, '🍽️') AS icon,
          COALESCE(fc.name_vi, 'Khác') AS category,
          COUNT(*)::int AS count,
          EXISTS(
            SELECT 1 FROM fridge_items fi2
            WHERE fi2.user_id = ANY($1) AND fue.food_id IS NOT NULL
              AND LOWER(fi2.name) = LOWER(f.food_name)
          ) AS in_fridge
        FROM food_usage_events fue
        LEFT JOIN foods f ON f.id = fue.food_id
        LEFT JOIN food_categories fc ON fc.id = f.category_id
        WHERE fue.user_id = ANY($1) AND fue.event_type = 'used'
        GROUP BY fue.food_id, f.food_name, f.icon, fc.name_vi
        ORDER BY count DESC
        LIMIT 6
      `, [userIds]),
      // Least used: fridge items never recorded in a 'used' event.
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
            SELECT 1 FROM food_usage_events fue
            WHERE fue.user_id = ANY($1) AND fue.event_type = 'used'
              AND (fue.fridge_item_id = fi.id OR (fue.food_id IS NOT NULL AND fue.food_id = f.id))
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
      return { expiredItems: [], activeCount: 0, expiredCount: 0, wasteRatio: 0, wastedEvents: [], wastedCount: 0, usedCount: 0 };
    }

    const today = localYmd(new Date());

    const [expiredRes, activeRes, wastedRes, wastedCountRes, usedCountRes] = await Promise.all([
      query(`
        SELECT fi.id::text AS fridge_item_id,
               fi.name AS food_name,
               COALESCE(f.icon, '🍽️') AS icon,
               fi.quantity::float AS quantity,
               COALESCE(u.name, 'miếng') AS unit,
               TO_CHAR(fi.expiration_date, 'YYYY-MM-DD') AS expiry_date,
               fi.storage_location AS location
        FROM fridge_items fi
        LEFT JOIN foods f ON LOWER(f.food_name) = LOWER(fi.name)
        LEFT JOIN units u ON u.id = fi.unit_id
        WHERE fi.user_id = ANY($1) AND fi.expiration_date < $2
        ORDER BY fi.expiration_date ASC
      `, [userIds, today]),
      query(`SELECT COUNT(*)::int AS total FROM fridge_items WHERE user_id = ANY($1) AND expiration_date >= $2`, [userIds, today]),
      // Explicit waste events from the "Xóa" (delete/throw away) action — last 30 days.
      query(`
        SELECT
          fue.id::text AS event_id,
          COALESCE(f.food_name, 'Thực phẩm khác') AS food_name,
          COALESCE(f.icon, '🍽️') AS icon,
          fue.quantity::float AS quantity,
          COALESCE(u.name, 'miếng') AS unit,
          TO_CHAR(fue.created_at, 'YYYY-MM-DD') AS wasted_date
        FROM food_usage_events fue
        LEFT JOIN foods f ON f.id = fue.food_id
        LEFT JOIN units u ON u.id = fue.unit_id
        WHERE fue.user_id = ANY($1) AND fue.event_type = 'wasted'
          AND fue.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY fue.created_at DESC
        LIMIT 20
      `, [userIds]),
      query(`
        SELECT COUNT(*)::int AS total FROM food_usage_events
        WHERE user_id = ANY($1) AND event_type = 'wasted' AND created_at >= NOW() - INTERVAL '30 days'
      `, [userIds]),
      query(`
        SELECT COUNT(*)::int AS total FROM food_usage_events
        WHERE user_id = ANY($1) AND event_type = 'used' AND created_at >= NOW() - INTERVAL '30 days'
      `, [userIds]),
    ]);

    const expiredCount = expiredRes.rows.length;
    const activeCount = activeRes.rows[0]?.total ?? 0;
    const wastedCount = wastedCountRes.rows[0]?.total ?? 0;
    const usedCount = usedCountRes.rows[0]?.total ?? 0;

    // "Lãng phí" = food that expired (still sitting in the fridge past its
    // expiry date) OR that the user explicitly threw away ("Xóa" → a
    // 'wasted' event). These two sets can't overlap — an expired item still
    // counted here disappears from `expiredItems` the moment it's deleted,
    // at which point it's already counted via wastedCount instead — so they
    // can be summed directly without double counting.
    const totalWaste = expiredCount + wastedCount;
    const handledTotal = totalWaste + usedCount;

    return {
      expiredItems: expiredRes.rows.map((r) => ({ ...r, quantity: Number(r.quantity) })),
      activeCount,
      expiredCount,
      wasteRatio: handledTotal > 0 ? Math.round((totalWaste / handledTotal) * 100) : 0,
      wastedEvents: wastedRes.rows.map((r) => ({ ...r, quantity: Number(r.quantity) })),
      wastedCount,
      usedCount,
    };
  }
}

module.exports = StatsModel;
