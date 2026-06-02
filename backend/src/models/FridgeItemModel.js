const { query } = require('../config/db');
const schema = require('../config/fridgeSchema');

const { tables: t, columns: c } = schema;

const STORAGE_LOCATIONS = ['Ngăn mát', 'Ngăn đá', 'Cửa tủ', 'Ngoài tủ', 'Ngăn đông', 'Kệ thường', 'Cánh tủ'];
const DEFAULT_LOCATION = 'Ngăn mát';
const STORAGE_TABLE = 'fridge_item_storage_locations';

const SORT_COLUMNS = {
  name: `tp.${c.foodName}`,
  expiryDate: `ctd.${c.expiry}`,
  quantity: `ctd.${c.quantity}`,
  createdAt: `ctd.${c.importedAt}`,
};

function formatDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
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
    return {
      location: 'Ngăn đông',
      reason: 'Nhóm thịt/cá/hải sản nên để ngăn đông để giảm hư hỏng nhanh.',
      confidence: 'high',
    };
  }
  if (hasKeyword(['rau', 'cu', 'qua', 'trai cay', 'sua', 'trung', 'dau hu'])) {
    return {
      location: 'Ngăn mát',
      reason: 'Rau củ, sữa và thực phẩm dùng sớm phù hợp bảo quản ngăn mát.',
      confidence: 'high',
    };
  }
  if (hasKeyword(['gia vi', 'hanh', 'toi', 'khoai', 'hanh tay', 'gao', 'mi'])) {
    return {
      location: 'Kệ thường',
      reason: 'Thực phẩm khô/gia vị nên để nơi khô ráo, thoáng mát.',
      confidence: 'medium',
    };
  }
  if (hasKeyword(['nuoc sot', 'sot', 'mut', 'bo lac'])) {
    return {
      location: 'Ngăn mát',
      reason: 'Nhóm sốt/mứt có thể để ngăn mát để ổn định và dễ lấy khi dùng thường xuyên.',
      confidence: 'medium',
    };
  }
  return {
    location: DEFAULT_LOCATION,
    reason: 'Chưa có rule đặc thù, ưu tiên bảo quản ngăn mát.',
    confidence: 'low',
  };
}

function mapRow(row, familyKey = null) {
  const daysUntilExpiry =
    row.days_until_expiry !== null && row.days_until_expiry !== undefined
      ? Number(row.days_until_expiry)
      : null;

  const foodId = row.food_id != null ? String(row.food_id) : null;

  return {
    id: String(row.id),
    name: row.food_name,
    quantity: Number(row.quantity),
    unit: row.unit_name || '',
    expiryDate: formatDate(row.expiry_date),
    category: row.category_id
      ? { id: String(row.category_id), name: row.category_name || null }
      : null,
    storageLocation: row.storage_location || DEFAULT_LOCATION,
    suggestedStorage: suggestStorageLocation(row.food_name, row.category_name || null),
    notes: null,
    familyGroupId: familyKey ?? (row.family_group_id != null ? String(row.family_group_id) : null),
    foodId,
    isExpiringSoon:
      daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0,
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
  ctd.${c.itemId} AS id,
  ctd.${c.foodId} AS food_id,
  tp.${c.foodName} AS food_name,
  ctd.${c.quantity} AS quantity,
  COALESCE(dv.${c.unitName}, '') AS unit_name,
  ctd.${c.expiry} AS expiry_date,
  tp.${c.categoryId} AS category_id,
  dm.${c.categoryName} AS category_name,
  COALESCE(fsl.storage_location, '${DEFAULT_LOCATION}') AS storage_location,
  tl.${c.familyId} AS family_group_id,
  ctd.${c.importedAt} AS created_at,
  ctd.${c.importedAt} AS updated_at,
  (ctd.${c.expiry} - CURRENT_DATE) AS days_until_expiry
`;

const BASE_FROM = `
  FROM ${t.item} ctd
  INNER JOIN ${t.fridge} tl ON ctd.${c.fridgeId} = tl.${c.fridgeId}
  INNER JOIN ${t.food} tp ON ctd.${c.foodId} = tp.${c.foodId}
  LEFT JOIN ${t.category} dm ON tp.${c.categoryId} = dm.${c.categoryId}
  LEFT JOIN ${t.unit} dv ON tp.${c.unitId} = dv.${c.unitId}
  LEFT JOIN ${STORAGE_TABLE} fsl ON fsl.${c.itemId} = ctd.${c.itemId}
`;

function accessClause(paramOffset = 1) {
  return `tl.${c.familyId} = $${paramOffset}`;
}

class FridgeItemModel {
  static getStorageLocations() {
    return STORAGE_LOCATIONS;
  }

  static suggestStorageLocation(name, categoryName = null) {
    return suggestStorageLocation(name, categoryName);
  }

  static async ensureStorageTable() {
    await query(`
      CREATE TABLE IF NOT EXISTS ${STORAGE_TABLE} (
        ${c.itemId} INTEGER PRIMARY KEY REFERENCES ${t.item}(${c.itemId}) ON DELETE CASCADE,
        storage_location VARCHAR(50) NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  static async upsertStorageLocation(itemId, storageLocation) {
    await this.ensureStorageTable();
    const safeLocation = STORAGE_LOCATIONS.includes(storageLocation) ? storageLocation : DEFAULT_LOCATION;
    await query(
      `
      INSERT INTO ${STORAGE_TABLE} (${c.itemId}, storage_location, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (${c.itemId})
      DO UPDATE SET storage_location = EXCLUDED.storage_location, updated_at = NOW()
      `,
      [itemId, safeLocation],
    );
  }

  /** Mock FE: family-1 → integer gia_dinh_id trên Supabase */
  static async resolveGiaDinhId(familyGroupId) {
    if (isNumericId(familyGroupId)) {
      return Number(familyGroupId);
    }

    const byName = await query(
      `SELECT ${c.familyId} AS id FROM ${t.family} WHERE ${c.familyName} = $1 LIMIT 1`,
      [schema.defaultFamilyName],
    );
    if (byName.rows[0]) return byName.rows[0].id;

    const any = await query(`SELECT ${c.familyId} AS id FROM ${t.family} ORDER BY ${c.familyId} LIMIT 1`);
    if (any.rows[0]) return any.rows[0].id;

    const created = await query(
      `INSERT INTO ${t.family} (${c.familyName}) VALUES ($1) RETURNING ${c.familyId} AS id`,
      [schema.defaultFamilyName],
    );
    return created.rows[0].id;
  }

  static async resolveFridgeId(giaDinhId) {
    const existing = await query(
      `SELECT ${c.fridgeId} AS id FROM ${t.fridge} WHERE ${c.familyId} = $1 LIMIT 1`,
      [giaDinhId],
    );
    if (existing.rows[0]) return existing.rows[0].id;

    const created = await query(
      `INSERT INTO ${t.fridge} (${c.familyId}) VALUES ($1) RETURNING ${c.fridgeId} AS id`,
      [giaDinhId],
    );
    return created.rows[0].id;
  }

  static async ensureReferenceData() {
    const catCount = await query(`SELECT COUNT(*)::int AS c FROM ${t.category}`);
    if ((catCount.rows[0]?.c ?? 0) === 0) {
      await query(`INSERT INTO ${t.category} (${c.categoryName}) VALUES ('Đồ khô'), ('Rau củ'), ('Thịt cá')`);
    }
    const unitCount = await query(`SELECT COUNT(*)::int AS c FROM ${t.unit}`);
    if ((unitCount.rows[0]?.c ?? 0) === 0) {
      await query(
        `INSERT INTO ${t.unit} (${c.unitName}) VALUES ('kg'), ('g'), ('lít'), ('quả'), ('miếng'), ('gói')`,
      );
    }
  }

  static async findOrCreateFood({ name, unit, categoryId }) {
    await this.ensureReferenceData();

    const found = await query(
      `SELECT ${c.foodId} AS id FROM ${t.food} WHERE ${c.foodName} ILIKE $1 LIMIT 1`,
      [name],
    );
    if (found.rows[0]) return found.rows[0].id;

    let danhMucId = null;
    if (categoryId && isNumericId(categoryId)) {
      danhMucId = Number(categoryId);
    } else {
      const cat = await query(`SELECT ${c.categoryId} AS id FROM ${t.category} ORDER BY ${c.categoryId} LIMIT 1`);
      danhMucId = cat.rows[0]?.id ?? null;
    }

    let donViId = null;
    const unitRow = await query(
      `SELECT ${c.unitId} AS id FROM ${t.unit} WHERE ${c.unitName} ILIKE $1 LIMIT 1`,
      [unit],
    );
    if (unitRow.rows[0]) {
      donViId = unitRow.rows[0].id;
    } else {
      const anyUnit = await query(`SELECT ${c.unitId} AS id FROM ${t.unit} ORDER BY ${c.unitId} LIMIT 1`);
      donViId = anyUnit.rows[0]?.id ?? null;
    }

    if (!danhMucId || !donViId) {
      throw new Error('Thiếu danh mục hoặc đơn vị trong database.');
    }

    const inserted = await query(
      `INSERT INTO ${t.food} (${c.foodName}, ${c.categoryId}, ${c.unitId})
       VALUES ($1, $2, $3)
       RETURNING ${c.foodId} AS id`,
      [name, danhMucId, donViId],
    );
    return inserted.rows[0].id;
  }

  static async findAll({ userId, familyGroupId, filters = {}, pagination = {} }) {
    await this.ensureStorageTable();
    const giaDinhId = await this.resolveGiaDinhId(familyGroupId);
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 20));
    const offset = (page - 1) * limit;
    const sortBy = SORT_COLUMNS[filters.sortBy] || SORT_COLUMNS.expiryDate;
    const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const params = [
      giaDinhId,
      filters.search || null,
      filters.categoryId && isNumericId(filters.categoryId) ? Number(filters.categoryId) : null,
      Boolean(filters.expiringSoon),
    ];

    const whereSql = `
      ${accessClause(1)}
      AND ($2::text IS NULL OR tp.${c.foodName} ILIKE '%' || $2 || '%')
      AND ($3::int IS NULL OR tp.${c.categoryId} = $3)
      AND ($4::boolean = FALSE OR ctd.${c.expiry} <= CURRENT_DATE + INTERVAL '3 days')
    `;

    const listParams = [...params, limit, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const listResult = await query(
      `
      SELECT ${BASE_SELECT}
      ${BASE_FROM}
      WHERE ${whereSql}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      listParams,
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total ${BASE_FROM} WHERE ${whereSql}`,
      params,
    );

    const summaryResult = await query(
      `
      SELECT
        COUNT(*)::int AS total_items,
        COUNT(*) FILTER (
          WHERE ctd.${c.expiry} <= CURRENT_DATE + INTERVAL '3 days'
        )::int AS expiring_soon_count
      ${BASE_FROM}
      WHERE ${accessClause(1)}
      `,
      [giaDinhId],
    );

    const total = countResult.rows[0]?.total || 0;
    const summary = summaryResult.rows[0] || { total_items: 0, expiring_soon_count: 0 };
    const familyKey = String(giaDinhId);

    return {
      items: listResult.rows.map((row) => mapRow(row, familyKey)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalItems: summary.total_items || 0,
        expiringSoonCount: summary.expiring_soon_count || 0,
      },
    };
  }

  static async findById(id, userId, familyGroupId = null) {
    await this.ensureStorageTable();
    const giaDinhId = await this.resolveGiaDinhId(familyGroupId);
    const itemId = isNumericId(id) ? Number(id) : id;

    const result = await query(
      `
      SELECT ${BASE_SELECT}
      ${BASE_FROM}
      WHERE ctd.${c.itemId} = $1
        AND ${accessClause(2)}
      `,
      [itemId, giaDinhId],
    );

    const row = result.rows[0];
    return row ? mapRow(row, String(giaDinhId)) : null;
  }

  static async create(data, userId) {
    await this.ensureStorageTable();
    const giaDinhId = await this.resolveGiaDinhId(data.familyGroupId);
    const fridgeId = await this.resolveFridgeId(giaDinhId);
    const foodId = data.foodId && isNumericId(data.foodId)
      ? Number(data.foodId)
      : await this.findOrCreateFood({
          name: data.name,
          unit: data.unit,
          categoryId: data.categoryId,
        });

    const result = await query(
      `
      INSERT INTO ${t.item} (
        ${c.fridgeId}, ${c.foodId}, ${c.quantity}, ${c.expiry}, ${c.importedAt}
      )
      VALUES ($1, $2, $3, $4, CURRENT_DATE)
      RETURNING ${c.itemId} AS id
      `,
      [fridgeId, foodId, data.quantity, data.expiryDate],
    );
    await this.upsertStorageLocation(result.rows[0].id, data.storageLocation);

    return this.findById(result.rows[0].id, userId, String(giaDinhId));
  }

  static async update(id, data, userId, familyGroupId = null) {
    await this.ensureStorageTable();
    const giaDinhId = await this.resolveGiaDinhId(familyGroupId);
    const itemId = isNumericId(id) ? Number(id) : id;

    if (data.name) {
      const current = await this.findById(itemId, userId, String(giaDinhId));
      if (current?.foodId) {
        await query(
          `UPDATE ${t.food} SET ${c.foodName} = $2 WHERE ${c.foodId} = $1`,
          [Number(current.foodId), data.name],
        );
      }
    }

    const fields = [];
    const params = [itemId, giaDinhId];
    let i = 3;

    if (data.quantity !== undefined) {
      fields.push(`${c.quantity} = $${i}`);
      params.push(data.quantity);
      i += 1;
    }
    if (data.expiryDate !== undefined) {
      fields.push(`${c.expiry} = $${i}`);
      params.push(data.expiryDate);
      i += 1;
    }

    if (fields.length) {
      await query(
        `
        UPDATE ${t.item} ctd
        SET ${fields.join(', ')}
        FROM ${t.fridge} tl
        WHERE ctd.${c.itemId} = $1
          AND ctd.${c.fridgeId} = tl.${c.fridgeId}
          AND tl.${c.familyId} = $2
        `,
        params,
      );
    }
    if (data.storageLocation) {
      await this.upsertStorageLocation(itemId, data.storageLocation);
    }

    return this.findById(itemId, userId, String(giaDinhId));
  }

  static async softDelete(id, userId, familyGroupId = null) {
    await this.ensureStorageTable();
    const giaDinhId = familyGroupId ? await this.resolveGiaDinhId(familyGroupId) : null;
    const itemId = isNumericId(id) ? Number(id) : id;

    const result = giaDinhId
      ? await query(
          `
          DELETE FROM ${t.item} ctd
          USING ${t.fridge} tl
          WHERE ctd.${c.itemId} = $1
            AND ctd.${c.fridgeId} = tl.${c.fridgeId}
            AND tl.${c.familyId} = $2
          `,
          [itemId, giaDinhId],
        )
      : await query(`DELETE FROM ${t.item} WHERE ${c.itemId} = $1`, [itemId]);

    return result.rowCount > 0;
  }

  static async bulkSoftDelete(ids, userId, familyGroupId = null) {
    await this.ensureStorageTable();
    if (!ids.length) return 0;
    const giaDinhId = familyGroupId ? await this.resolveGiaDinhId(familyGroupId) : null;
    const numericIds = ids.map((id) => (isNumericId(id) ? Number(id) : id));

    const result = giaDinhId
      ? await query(
          `
          DELETE FROM ${t.item} ctd
          USING ${t.fridge} tl
          WHERE ctd.${c.itemId} = ANY($1::int[])
            AND ctd.${c.fridgeId} = tl.${c.fridgeId}
            AND tl.${c.familyId} = $2
          `,
          [numericIds, giaDinhId],
        )
      : await query(`DELETE FROM ${t.item} WHERE ${c.itemId} = ANY($1::int[])`, [numericIds]);

    return result.rowCount || 0;
  }

  static async updateQuantity(id, quantityUsed, action, userId, familyGroupId = null) {
    await this.ensureStorageTable();
    const giaDinhId = familyGroupId ? await this.resolveGiaDinhId(familyGroupId) : null;
    const itemId = isNumericId(id) ? Number(id) : id;

    const result = giaDinhId
      ? await query(
          `
          UPDATE ${t.item} ctd
          SET ${c.quantity} = CASE
            WHEN $4 = 'restock' THEN ctd.${c.quantity} + $3
            ELSE GREATEST(ctd.${c.quantity} - $3, 0)
          END
          FROM ${t.fridge} tl
          WHERE ctd.${c.itemId} = $1
            AND ctd.${c.fridgeId} = tl.${c.fridgeId}
            AND tl.${c.familyId} = $2
          `,
          [itemId, giaDinhId, quantityUsed, action],
        )
      : await query(
          `
          UPDATE ${t.item}
          SET ${c.quantity} = CASE
            WHEN $3 = 'restock' THEN ${c.quantity} + $2
            ELSE GREATEST(${c.quantity} - $2, 0)
          END
          WHERE ${c.itemId} = $1
          `,
          [itemId, quantityUsed, action],
        );

    if (!result.rowCount) return null;
    return this.findById(itemId, userId, giaDinhId ? String(giaDinhId) : null);
  }

  static async findExpiring(userId, daysAhead = 3) {
    const result = await query(
      `
      SELECT
        ctd.${c.itemId} AS id,
        tp.${c.foodName} AS name,
        ctd.${c.expiry} AS expiry_date,
        (ctd.${c.expiry} - CURRENT_DATE) AS days_until_expiry
      ${BASE_FROM}
      WHERE ctd.${c.expiry} <= CURRENT_DATE + $1::int
      ORDER BY ctd.${c.expiry} ASC
      LIMIT 50
      `,
      [daysAhead],
    );

    return result.rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      expiryDate: formatDate(row.expiry_date),
      daysUntilExpiry: Number(row.days_until_expiry),
    }));
  }

  static async findForExport(userId, familyGroupId = null) {
    await this.ensureStorageTable();
    const giaDinhId = await this.resolveGiaDinhId(familyGroupId);
    const result = await query(
      `
      SELECT
        tp.${c.foodName} AS name,
        ctd.${c.quantity} AS quantity,
        COALESCE(dv.${c.unitName}, '') AS unit,
        ctd.${c.expiry} AS expiry_date,
        dm.${c.categoryName} AS category_name,
        COALESCE(fsl.storage_location, '${DEFAULT_LOCATION}') AS storage_location,
        ctd.${c.importedAt} AS created_at
      ${BASE_FROM}
      WHERE ${accessClause(1)}
      ORDER BY ctd.${c.expiry} ASC, tp.${c.foodName} ASC
      `,
      [giaDinhId],
    );
    return result.rows;
  }

  static async findAvailableIngredients(userId, familyGroupId = null) {
    const giaDinhId = await this.resolveGiaDinhId(familyGroupId);
    const result = await query(
      `
      SELECT
        tp.${c.foodName} AS name,
        ctd.${c.quantity} AS quantity,
        COALESCE(dv.${c.unitName}, '') AS unit,
        dm.${c.categoryName} AS category_name
      ${BASE_FROM}
      WHERE ${accessClause(1)}
        AND ctd.${c.quantity} > 0
      ORDER BY tp.${c.foodName} ASC
      `,
      [giaDinhId],
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
