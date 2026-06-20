const { query } = require('../config/db');
const fridgeSchema = require('../config/fridgeSchema');

const { tables: t, columns: c } = fridgeSchema;

// Categories are admin-managed (food_categories table) and open-ended — any
// real category name must pass through as-is. Only fall back to "Khác" when
// a food has no category at all (NULL). Previously this re-mapped every
// category through a hardcoded substring-match list, so any admin-created
// category not in that list (e.g. "Đậu & hạt") silently became "Khác".
function mapCategory(name) {
  return name || 'Khác';
}

class FoodModel {
  static async list({ search = null, limit = 300 } = {}) {
    const result = await query(
      `
      SELECT
        tp.${c.foodId} AS id,
        tp.${c.foodName} AS food_name,
        COALESCE(dm.${c.categoryName}, 'Khác') AS category,
        COALESCE(dv.${c.unitName}, 'g') AS unit
      FROM ${t.food} tp
      LEFT JOIN ${t.category} dm ON dm.id = tp.${c.categoryId}
      LEFT JOIN ${t.unit} dv ON dv.id = tp.${c.unitId}
      WHERE ($1::text IS NULL OR tp.${c.foodName} ILIKE '%' || $1 || '%')
      ORDER BY tp.${c.foodName}
      LIMIT $2
      `,
      [search, Math.min(500, Math.max(1, Number(limit) || 300))],
    );
    return result.rows.map((row) => ({
      id: String(row.id),
      food_name: row.food_name,
      category: mapCategory(row.category),
      unit: row.unit || 'g',
      icon: '🍽️',
    }));
  }
}

module.exports = FoodModel;
