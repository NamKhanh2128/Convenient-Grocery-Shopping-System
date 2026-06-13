const { query } = require('../config/db');
const schema = require('../config/fridgeSchema');

const { tables: t, columns: c } = schema;

const STORAGE_LOCATIONS = ['Ngăn mát', 'Ngăn đá', 'Cửa tủ', 'Ngoài tủ', 'Ngăn đông', 'Kệ thường', 'Cánh tủ'];
const DEFAULT_LOCATION = 'Ngăn mát';

// The DB enforces a CHECK constraint allowing only English storage codes
// ('freezer' | 'fridge' | 'door'), while the UI/validation use Vietnamese
// labels. Translate at the model boundary so neither side has to change.
const STORAGE_VN_TO_DB = {
  'Ngăn mát': 'fridge',
  'Ngăn đông': 'freezer',
  'Ngăn đá': 'freezer',
  'Kệ thường': 'door',
  'Cửa tủ': 'door',
  'Cánh tủ': 'door',
  'Ngoài tủ': 'door',
};
const STORAGE_DB_TO_VN = {
  fridge: 'Ngăn mát',
  freezer: 'Ngăn đông',
  door: 'Kệ thường',
};

function toDbStorage(value) {
  if (!value) return STORAGE_VN_TO_DB[DEFAULT_LOCATION];
  if (STORAGE_VN_TO_DB[value]) return STORAGE_VN_TO_DB[value];
  if (STORAGE_DB_TO_VN[value]) return value; // already a DB code
  return STORAGE_VN_TO_DB[DEFAULT_LOCATION];
}

function toVnStorage(value) {
  if (!value) return DEFAULT_LOCATION;
  if (STORAGE_DB_TO_VN[value]) return STORAGE_DB_TO_VN[value];
  if (STORAGE_VN_TO_DB[value]) return value; // already a VN label
  return DEFAULT_LOCATION;
}

const SORT_COLUMNS = {
  name: `fi.${c.itemName}`,
  expiryDate: `fi.${c.expiry}`,
  quantity: `fi.${c.quantity}`,
  createdAt: `fi.${c.createdAt}`,
};

function formatDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    // The pg driver parses DATE columns as a JS Date at local midnight.
    // Use local Y/M/D parts (not toISOString, which shifts to UTC and can
    // roll the date back a day in timezones ahead of UTC, e.g. UTC+7).
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

function isNumericId(value) {
  return /^\d+$/.test(String(value ?? ''));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function suggestStorageLocation(name, categoryName) {
  const n = normalizeText(name);
  const cName = normalizeText(categoryName);
  const hasKeyword = (keywords) => keywords.some((kw) => n.includes(kw) || cName.includes(kw));

  if (hasKeyword(['thit', 'ca', 'hai san', 'tom', 'muc', 'bo vien', 'xuc xich'])) {
    return { location: 'Ngăn đông', reason: 'Nhóm thịt/cá/hải sản nên để ngăn đông.', confidence: 'high' };
  }
  if (hasKeyword(['rau', 'cu', 'qua', 'trai cay', 'sua', 'trung', 'dau hu'])) {
    return { location: 'Ngăn mát', reason: 'Nhóm rau củ, sữa và thực phẩm dùng sớm phù hợp ngăn mát.', confidence: 'high' };
  }
  if (hasKeyword(['gia vi', 'hanh', 'toi', 'khoai', 'gao', 'mi'])) {
    return { location: 'Kệ thường', reason: 'Nhóm thực phẩm khô nên để nơi khô ráo.', confidence: 'medium' };
  }
  return { location: DEFAULT_LOCATION, reason: 'Chưa có rule đặc thù, ưu tiên ngăn mát.', confidence: 'low' };
}

function mapRow(row, familyKey = null) {
  const daysUntilExpiry =
    row.days_until_expiry !== null && row.days_until_expiry !== undefined ? Number(row.days_until_expiry) : null;
  const foodName = row.food_name || row.name;

  return {
    id: String(row.id),
    name: foodName,
    quantity: Number(row.quantity),
    unit: row.unit_symbol || row.unit_name || '',
    expiryDate: formatDate(row.expiry_date),
    category: row.category_id ? { id: String(row.category_id), name: row.category_name || null } : null,
    storageLocation: toVnStorage(row.storage_location),
    suggestedStorage: suggestStorageLocation(foodName, row.category_name || null),
    notes: null,
    familyGroupId: familyKey,
    foodId: row.food_id != null ? String(row.food_id) : null,
    isExpiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0,
    daysUntilExpiry,
    addedBy: {
      id: row.user_id != null ? String(row.user_id) : null,
      name: row.user_name || null,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const BASE_SELECT = `
  fi.${c.itemId} AS id,
  fi.${c.userId} AS user_id,
  NULL::int AS food_id,
  fi.${c.itemName} AS food_name,
  fi.${c.quantity} AS quantity,
  u.${c.unitName} AS unit_name,
  u.${c.unitSymbol} AS unit_symbol,
  fi.${c.expiry} AS expiry_date,
  fi.${c.categoryId} AS category_id,
  fc.${c.categoryName} AS category_name,
  fi.${c.storageLocation} AS storage_location,
  fi.${c.createdAt} AS created_at,
  fi.${c.updatedAt} AS updated_at,
  usr.${c.userName} AS user_name,
  (fi.${c.expiry} - CURRENT_DATE) AS days_until_expiry
`;

const BASE_FROM = `
  FROM ${t.item} fi
  LEFT JOIN ${t.category} fc ON fc.id = fi.${c.categoryId}
  LEFT JOIN ${t.unit} u ON u.id = fi.${c.unitId}
  LEFT JOIN ${t.user} usr ON usr.id = fi.${c.userId}
`;

class FridgeItemModel {
  static getStorageLocations() {
    return STORAGE_LOCATIONS;
  }

  static suggestStorageLocation(name, categoryName = null) {
    return suggestStorageLocation(name, categoryName);
  }

  static async resolveGiaDinhId(familyGroupId) {
    if (isNumericId(familyGroupId)) return Number(familyGroupId);
    const { rows } = await query(`SELECT id FROM ${t.family} ORDER BY id LIMIT 1`);
    return rows[0]?.id || null;
  }

  static async getFamilyUserIds(userId, familyGroupId) {
    if (!familyGroupId || !isNumericId(familyGroupId)) return [Number(userId)].filter(Boolean);
    const { rows } = await query(
      `SELECT ${c.memberUserId} AS user_id FROM ${t.member} WHERE ${c.memberFamilyId} = $1`,
      [Number(familyGroupId)]
    );
    const ids = rows.map((row) => Number(row.user_id)).filter(Boolean);
    return ids.length ? ids : [Number(userId)].filter(Boolean);
  }

  static async findUnitId(unit) {
    const text = String(unit || '').trim() || 'g';
    const found = await query(
      `SELECT id FROM ${t.unit} WHERE lower(name) = lower($1) OR lower(symbol) = lower($1) LIMIT 1`,
      [text]
    );
    if (found.rows[0]) return found.rows[0].id;
    const created = await query(
      `INSERT INTO ${t.unit} (name, symbol) VALUES ($1, $1) RETURNING id`,
      [text]
    );
    return created.rows[0].id;
  }

  static async findCategoryId(categoryId) {
    if (categoryId && isNumericId(categoryId)) return Number(categoryId);
    const any = await query(`SELECT id FROM ${t.category} ORDER BY id LIMIT 1`);
    if (any.rows[0]) return any.rows[0].id;
    const created = await query(
      `INSERT INTO ${t.category} (name_vi, name_en, description) VALUES ('Khác', 'Other', 'Default category') RETURNING id`
    );
    return created.rows[0].id;
  }

  static async findOrCreateFood({ name, unit, categoryId }) {
    const safeName = String(name || '').trim();
    if (!safeName) throw new Error('Thiếu tên thực phẩm.');

    const found = await query(`SELECT id FROM ${t.food} WHERE lower(food_name) = lower($1) LIMIT 1`, [safeName]);
    if (found.rows[0]) return found.rows[0].id;

    const unitId = await this.findUnitId(unit);
    const safeCategoryId = await this.findCategoryId(categoryId);
    const inserted = await query(
      `INSERT INTO ${t.food} (food_name, unit_id, category_id) VALUES ($1, $2, $3) RETURNING id`,
      [safeName, unitId, safeCategoryId]
    );
    return inserted.rows[0].id;
  }

  static async findAll({ userId, familyGroupId, filters = {}, pagination = {} }) {
    const userIds = await this.getFamilyUserIds(userId, familyGroupId);
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;
    const sortBy = SORT_COLUMNS[filters.sortBy] || SORT_COLUMNS.expiryDate;
    const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const params = [userIds, filters.search || null, filters.categoryId && isNumericId(filters.categoryId) ? Number(filters.categoryId) : null, Boolean(filters.expiringSoon)];

    const whereSql = `
      fi.${c.userId} = ANY($1::int[])
      AND ($2::text IS NULL OR fi.${c.itemName} ILIKE '%' || $2 || '%')
      AND ($3::int IS NULL OR fi.${c.categoryId} = $3)
      AND ($4::boolean = FALSE OR fi.${c.expiry} <= CURRENT_DATE + INTERVAL '3 days')
    `;

    const listResult = await query(
      `SELECT ${BASE_SELECT} ${BASE_FROM}
       WHERE ${whereSql}
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $5 OFFSET $6`,
      [...params, limit, offset]
    );
    const countResult = await query(`SELECT COUNT(*)::int AS total ${BASE_FROM} WHERE ${whereSql}`, params);
    const summaryResult = await query(
      `SELECT COUNT(*)::int AS total_items,
              COUNT(*) FILTER (WHERE ${c.expiry} <= CURRENT_DATE + INTERVAL '3 days')::int AS expiring_soon_count
       FROM ${t.item}
       WHERE ${c.userId} = ANY($1::int[])`,
      [userIds]
    );

    const total = countResult.rows[0]?.total || 0;
    const summary = summaryResult.rows[0] || {};
    return {
      items: listResult.rows.map((row) => mapRow(row, familyGroupId ? String(familyGroupId) : null)),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
      summary: {
        totalItems: summary.total_items || 0,
        expiringSoonCount: summary.expiring_soon_count || 0,
      },
    };
  }

  static async findById(id, userId, familyGroupId = null) {
    const userIds = await this.getFamilyUserIds(userId, familyGroupId);
    const result = await query(
      `SELECT ${BASE_SELECT} ${BASE_FROM}
       WHERE fi.${c.itemId} = $1 AND fi.${c.userId} = ANY($2::int[])`,
      [Number(id), userIds]
    );
    return result.rows[0] ? mapRow(result.rows[0], familyGroupId ? String(familyGroupId) : null) : null;
  }

  static async create(data, userId) {
    const foodId = data.foodId && isNumericId(data.foodId)
      ? Number(data.foodId)
      : await this.findOrCreateFood({ name: data.name, unit: data.unit, categoryId: data.categoryId });
    const food = await query(`SELECT food_name, unit_id, category_id FROM ${t.food} WHERE id = $1`, [foodId]);
    const row = food.rows[0];
    const unitId = row?.unit_id || (await this.findUnitId(data.unit));
    const categoryId = data.categoryId && isNumericId(data.categoryId) ? Number(data.categoryId) : row?.category_id || (await this.findCategoryId());

    const result = await query(
      `INSERT INTO ${t.item} (user_id, name, quantity, unit_id, category_id, expiration_date, storage_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [Number(userId), row?.food_name || data.name, data.quantity, unitId, categoryId, data.expiryDate, toDbStorage(data.storageLocation)]
    );
    // Query by userId only (no family scope) so the item is always found
    // regardless of group_members consistency after insert.
    return this.findById(result.rows[0].id, userId);
  }

  static async update(id, data, userId, familyGroupId = null) {
    const existing = await this.findById(id, userId, familyGroupId);
    if (!existing) return null;

    const fields = [];
    const params = [Number(id)];
    let index = 2;
    if (data.name !== undefined) {
      fields.push(`name = $${index}`);
      params.push(String(data.name).trim());
      index += 1;
    }
    if (data.quantity !== undefined) {
      fields.push(`quantity = $${index}`);
      params.push(Number(data.quantity));
      index += 1;
    }
    if (data.expiryDate !== undefined) {
      fields.push(`expiration_date = $${index}`);
      params.push(data.expiryDate);
      index += 1;
    }
    if (data.storageLocation !== undefined) {
      fields.push(`storage_location = $${index}`);
      params.push(toDbStorage(data.storageLocation));
      index += 1;
    }
    if (data.unit !== undefined) {
      fields.push(`unit_id = $${index}`);
      params.push(await this.findUnitId(data.unit));
      index += 1;
    }
    if (data.categoryId !== undefined) {
      fields.push(`category_id = $${index}`);
      params.push(await this.findCategoryId(data.categoryId));
      index += 1;
    }
    if (fields.length) {
      fields.push('updated_at = NOW()');
      await query(`UPDATE ${t.item} SET ${fields.join(', ')} WHERE id = $1`, params);
    }
    return this.findById(id, userId, familyGroupId);
  }

  static async softDelete(id, userId, familyGroupId = null) {
    const existing = await this.findById(id, userId, familyGroupId);
    if (!existing) return false;
    const result = await query(`DELETE FROM ${t.item} WHERE id = $1`, [Number(id)]);
    return result.rowCount > 0;
  }

  static async bulkSoftDelete(ids, userId, familyGroupId = null) {
    const userIds = await this.getFamilyUserIds(userId, familyGroupId);
    const numericIds = ids.filter(isNumericId).map(Number);
    if (!numericIds.length) return 0;
    const result = await query(
      `DELETE FROM ${t.item} WHERE id = ANY($1::int[]) AND user_id = ANY($2::int[])`,
      [numericIds, userIds]
    );
    return result.rowCount || 0;
  }

  static async updateQuantity(id, quantityUsed, action, userId, familyGroupId = null) {
    const existing = await this.findById(id, userId, familyGroupId);
    if (!existing) return null;
    await query(
      `UPDATE ${t.item}
       SET quantity = CASE WHEN $3 = 'restock' THEN quantity + $2 ELSE GREATEST(quantity - $2, 0) END,
           updated_at = NOW()
       WHERE id = $1`,
      [Number(id), Number(quantityUsed), action]
    );
    return this.findById(id, userId, familyGroupId);
  }

  static async findExpiring(userId, daysAhead = 3, familyGroupId = null) {
    const userIds = await this.getFamilyUserIds(userId, familyGroupId);
    const result = await query(
      `SELECT id, name, expiration_date AS expiry_date,
              (expiration_date - CURRENT_DATE) AS days_until_expiry
       FROM ${t.item}
       WHERE user_id = ANY($1::int[]) AND expiration_date <= CURRENT_DATE + $2::int
       ORDER BY expiration_date ASC
       LIMIT 50`,
      [userIds, Number(daysAhead)]
    );
    return result.rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      expiryDate: formatDate(row.expiry_date),
      daysUntilExpiry: Number(row.days_until_expiry),
    }));
  }

  static async findForExport(userId, familyGroupId = null) {
    const userIds = await this.getFamilyUserIds(userId, familyGroupId);
    const result = await query(
      `SELECT fi.name, fi.quantity, COALESCE(u.symbol, u.name, '') AS unit,
              fi.expiration_date AS expiry_date, fc.name_vi AS category_name,
              fi.storage_location, fi.added_at AS created_at
       FROM ${t.item} fi
       LEFT JOIN ${t.unit} u ON u.id = fi.unit_id
       LEFT JOIN ${t.category} fc ON fc.id = fi.category_id
       WHERE fi.user_id = ANY($1::int[])
       ORDER BY fi.expiration_date ASC, fi.name ASC`,
      [userIds]
    );
    return result.rows;
  }

  static async findAvailableIngredients(userId, familyGroupId = null) {
    const userIds = await this.getFamilyUserIds(userId, familyGroupId);
    const result = await query(
      `SELECT fi.name, fi.quantity, COALESCE(u.symbol, u.name, '') AS unit, fc.name_vi AS category_name
       FROM ${t.item} fi
       LEFT JOIN ${t.unit} u ON u.id = fi.unit_id
       LEFT JOIN ${t.category} fc ON fc.id = fi.category_id
       WHERE fi.user_id = ANY($1::int[]) AND fi.quantity > 0
       ORDER BY fi.name ASC`,
      [userIds]
    );
    return result.rows.map((row) => ({
      name: row.name,
      quantity: Number(row.quantity),
      unit: row.unit,
      category: row.category_name || null,
    }));
  }
}

module.exports = FridgeItemModel;
