const { query } = require('../config/db');
const schema = require('../config/recipeSchema');
const FridgeItemModel = require('./FridgeItemModel');
const bridge = require('../utils/shoppingBridge');

const { tables: t, columns: c } = schema;

function isNumericId(value) {
  return /^\d+$/.test(String(value ?? ''));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function splitInstructions(text) {
  if (!text) return [];
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/^\d+[\).\s-]+/, '').trim())
    .filter(Boolean);
}

function mapIngredientRow(row) {
  return {
    id: String(row.nguyen_lieu_id),
    ten_nguyen_lieu: row.ten_nguyen_lieu,
    so_luong: row.so_luong !== null && row.so_luong !== undefined ? Number(row.so_luong) : null,
    don_vi: row.don_vi || null,
    thuc_pham_id: row.thuc_pham_id ? String(row.thuc_pham_id) : null,
    ten_thuc_pham: row.ten_thuc_pham || null,
    thu_tu: row.thu_tu ?? 0,
  };
}

function deriveDifficulty(timeMinutes, ingredientCount) {
  const time = Number(timeMinutes) || 30;
  const count = Number(ingredientCount) || 0;
  if (time <= 20 && count <= 5) return 'Dễ';
  if (time <= 50 && count <= 8) return 'Trung bình';
  return 'Khó';
}

function deriveCalories(ingredients = [], servings = 2) {
  const base = ingredients.reduce((sum, ing) => sum + (Number(ing.so_luong) || 1) * 35, 120);
  return Math.round(base / Math.max(1, Number(servings) || 2));
}

function mapRecipeRow(row, ingredients = [], ingredientCount = null) {
  const title = row[c.title] ?? row.ten_mon_an ?? row.tieu_de ?? '';
  const instructionsText = row[c.instructions] ?? row.huong_dan_nau ?? row.huong_dan ?? '';
  const servings = row.khau_phan ?? 2;
  const ingCount = ingredientCount ?? ingredients.length;
  return {
    id: String(row.cong_thuc_id ?? row.id),
    tieu_de: title,
    mo_ta: row.mo_ta || '',
    huong_dan: instructionsText,
    instructions: splitInstructions(instructionsText),
    thoi_gian_phut: row.thoi_gian_phut ?? 30,
    khau_phan: servings,
    ingredient_count: ingCount,
    calories: deriveCalories(ingredients, servings) || Math.max(150, ingCount * 80),
    do_kho: deriveDifficulty(row.thoi_gian_phut, ingCount),
    hinh_anh_url: row.hinh_anh_url || '',
    loai_quyen: row.loai_quyen,
    danh_muc: row.danh_muc_id
      ? { id: String(row.danh_muc_id), ten: row.ten_danh_muc || null }
      : null,
    nguoi_tao_id: row.nguoi_tao_id ? String(row.nguoi_tao_id) : null,
    gia_dinh_id: row.gia_dinh_id ? String(row.gia_dinh_id) : null,
    da_yeu_thich: Boolean(row.da_yeu_thich),
    nguyen_lieu: ingredients,
    ngay_tao: row.ngay_tao,
    ngay_cap_nhat: row.ngay_cap_nhat,
  };
}

const SYSTEM_RECIPES = [
  {
    tieu_de: 'Phở bò tái',
    mo_ta: 'Món phở truyền thống với nước dùng trong, thịt bò tái mềm.',
    huong_dan: 'Nấu nước dùng từ xương bò 3-4 giờ.\nThái bò tái mỏng.\nTrần bánh phở, xếp thịt và rau thơm.\nChan nước dùng sôi, thưởng thức nóng.',
    thoi_gian_phut: 180,
    khau_phan: 4,
    hinh_anh_url: 'https://images.unsplash.com/photo-1591814468924-caf87d1232e0?w=800',
    danh_muc: 'Món chính',
    ingredients: [
      { ten: 'Thịt bò', so_luong: 400, don_vi: 'g' },
      { ten: 'Bánh phở', so_luong: 500, don_vi: 'g' },
      { ten: 'Hành tây', so_luong: 2, don_vi: 'củ' },
      { ten: 'Gừng', so_luong: 50, don_vi: 'g' },
    ],
  },
  {
    tieu_de: 'Cơm rang dưa bò',
    mo_ta: 'Cơm rang thơm với dưa bò chua cay đặc trưng.',
    huong_dan: 'Xào dưa bò với tỏi ớt.\nCho cơm nguội vào đảo đều.\nNêm gia vị, thêm hành lá.',
    thoi_gian_phut: 25,
    khau_phan: 2,
    hinh_anh_url: 'https://images.unsplash.com/photo-1603133872877-684f208fb84b?w=800',
    danh_muc: 'Món chính',
    ingredients: [
      { ten: 'Cơm nguội', so_luong: 2, don_vi: 'gói' },
      { ten: 'Dưa bò', so_luong: 150, don_vi: 'g' },
      { ten: 'Trứng', so_luong: 2, don_vi: 'quả' },
    ],
  },
  {
    tieu_de: 'Canh chua cá lóc',
    mo_ta: 'Canh chua đậm đà với cá lóc tươi và rau thơm.',
    huong_dan: 'Luộc cá lóc, lọc thịt.\nNấu nước dùng với cà chua, dứa, me.\n Cho cá vào, nêm vừa ăn.\nThêm rau thơm trước khi tắt bếp.',
    thoi_gian_phut: 40,
    khau_phan: 4,
    hinh_anh_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
    danh_muc: 'Súp & canh',
    ingredients: [
      { ten: 'Cá lóc', so_luong: 500, don_vi: 'g' },
      { ten: 'Cà chua', so_luong: 3, don_vi: 'quả' },
      { ten: 'Dứa', so_luong: 100, don_vi: 'g' },
    ],
  },
  {
    tieu_de: 'Gỏi cuốn tôm thịt',
    mo_ta: 'Gỏi cuốn thanh mát với tôm, thịt và rau sống.',
    huong_dan: 'Luộc tôm và thịt, thái mỏng.\nNhúng bánh tráng, cuốn rau và nhân.\nChấm nước mắm pha.',
    thoi_gian_phut: 30,
    khau_phan: 4,
    hinh_anh_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    danh_muc: 'Món phụ',
    ingredients: [
      { ten: 'Tôm', so_luong: 200, don_vi: 'g' },
      { ten: 'Thịt ba chỉ', so_luong: 200, don_vi: 'g' },
      { ten: 'Bánh tráng', so_luong: 20, don_vi: 'miếng' },
      { ten: 'Rau sống', so_luong: 1, don_vi: 'gói' },
    ],
  },
  {
    tieu_de: 'Bánh flan caramel',
    mo_ta: 'Tráng miệng mềm mịn với lớp caramel vàng óng.',
    huong_dan: 'Làm caramel đổ đáy khuôn.\nĐánh trứng với sữa và đường.\nLọc hỗn hợp, hấp cách thủy 35 phút.\nĐể lạnh trước khi dùng.',
    thoi_gian_phut: 50,
    khau_phan: 6,
    hinh_anh_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800',
    danh_muc: 'Tráng miệng',
    ingredients: [
      { ten: 'Trứng', so_luong: 4, don_vi: 'quả' },
      { ten: 'Sữa tươi', so_luong: 400, don_vi: 'ml' },
      { ten: 'Đường', so_luong: 120, don_vi: 'g' },
    ],
  },
  {
    tieu_de: 'Salad rau củ',
    mo_ta: 'Salad nhẹ nhàng, giàu vitamin từ rau củ tươi.',
    huong_dan: 'Rửa sạch rau củ, thái sợi.\nPha sốt dầu olive và chanh.\nTrộn đều, dùng ngay.',
    thoi_gian_phut: 15,
    khau_phan: 2,
    hinh_anh_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    danh_muc: 'Món chay',
    ingredients: [
      { ten: 'Xà lách', so_luong: 1, don_vi: 'gói' },
      { ten: 'Cà chua', so_luong: 2, don_vi: 'quả' },
      { ten: 'Dưa leo', so_luong: 1, don_vi: 'quả' },
    ],
  },
];

let recipeTablesReady = false;
const resolvedUserCache = new Map();

class RecipeModel {
  static async ensureRecipeTables() {
    if (recipeTablesReady) return;
    await query(`
      CREATE TABLE IF NOT EXISTS danh_muc_cong_thuc (
        danh_muc_cong_thuc_id SERIAL PRIMARY KEY,
        ten_danh_muc VARCHAR(100) NOT NULL UNIQUE,
        mo_ta TEXT,
        ngay_tao TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS cong_thuc (
        cong_thuc_id SERIAL PRIMARY KEY,
        ten_mon_an VARCHAR(255) NOT NULL,
        mo_ta TEXT,
        huong_dan_nau TEXT NOT NULL,
        thoi_gian_phut INT DEFAULT 30,
        khau_phan INT DEFAULT 2,
        hinh_anh_url TEXT,
        danh_muc_id INT REFERENCES danh_muc_cong_thuc(danh_muc_cong_thuc_id),
        nguoi_tao_id INT REFERENCES nguoi_dung(nguoi_dung_id) ON DELETE SET NULL,
        loai_quyen VARCHAR(10) NOT NULL DEFAULT 'PRIVATE'
          CHECK (loai_quyen IN ('SYSTEM','PRIVATE','FAMILY')),
        gia_dinh_id INT REFERENCES gia_dinh(gia_dinh_id) ON DELETE SET NULL,
        ngay_tao TIMESTAMPTZ DEFAULT NOW(),
        ngay_cap_nhat TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS cong_thuc_nguyen_lieu (
        nguyen_lieu_id SERIAL PRIMARY KEY,
        cong_thuc_id INT NOT NULL REFERENCES cong_thuc(cong_thuc_id) ON DELETE CASCADE,
        thuc_pham_id INT REFERENCES thuc_pham(thuc_pham_id) ON DELETE SET NULL,
        ten_nguyen_lieu VARCHAR(200) NOT NULL,
        so_luong NUMERIC(10,2),
        don_vi VARCHAR(50),
        thu_tu INT DEFAULT 0
      )
    `);
    await query(`
      CREATE TABLE IF NOT EXISTS cong_thuc_yeu_thich (
        nguoi_dung_id INT NOT NULL REFERENCES nguoi_dung(nguoi_dung_id) ON DELETE CASCADE,
        cong_thuc_id INT NOT NULL REFERENCES cong_thuc(cong_thuc_id) ON DELETE CASCADE,
        ngay_tao TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (nguoi_dung_id, cong_thuc_id)
      )
    `);

    await this.ensureRecipeColumns();
    await this.seedReferenceData();
    recipeTablesReady = true;
  }

  static async ensureRecipeColumns() {
    const alters = [
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.title} VARCHAR(255)`,
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.instructions} TEXT`,
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.description} TEXT`,
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.timeMinutes} INT DEFAULT 30`,
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.servings} INT DEFAULT 2`,
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.imageUrl} TEXT`,
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.categoryId} INT`,
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.creatorId} INT`,
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.privacy} VARCHAR(10) DEFAULT 'PRIVATE'`,
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.familyId} INT`,
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.createdAt} TIMESTAMPTZ DEFAULT NOW()`,
      `ALTER TABLE ${t.recipe} ADD COLUMN IF NOT EXISTS ${c.updatedAt} TIMESTAMPTZ DEFAULT NOW()`,
    ];
    for (const sql of alters) {
      try {
        await query(sql);
      } catch (error) {
        if (error.code !== '42701') throw error;
      }
    }
    await query(`UPDATE ${t.recipe} SET ${c.privacy} = 'PRIVATE' WHERE ${c.privacy} IS NULL`);
  }

  static async seedReferenceData() {
    const categories = ['Món chính', 'Món phụ', 'Tráng miệng', 'Súp & canh', 'Đồ uống', 'Món chay'];
    for (const name of categories) {
      await query(
        `INSERT INTO ${t.recipeCategory} (${c.categoryName}) VALUES ($1) ON CONFLICT (${c.categoryName}) DO NOTHING`,
        [name],
      );
    }

    const count = await query(`SELECT COUNT(*)::int AS c FROM ${t.recipe} WHERE ${c.privacy} = 'SYSTEM'`);
    if ((count.rows[0]?.c ?? 0) > 0) return;

    for (const recipe of SYSTEM_RECIPES) {
      const cat = await query(
        `SELECT ${c.categoryPk} AS id FROM ${t.recipeCategory} WHERE ${c.categoryName} = $1 LIMIT 1`,
        [recipe.danh_muc],
      );
      const inserted = await query(
        `INSERT INTO ${t.recipe}
          (${c.title}, ${c.description}, ${c.instructions}, ${c.timeMinutes}, ${c.servings},
           ${c.imageUrl}, ${c.categoryId}, ${c.privacy})
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'SYSTEM')
         RETURNING ${c.recipeId} AS id`,
        [
          recipe.tieu_de,
          recipe.mo_ta,
          recipe.huong_dan,
          recipe.thoi_gian_phut,
          recipe.khau_phan,
          recipe.hinh_anh_url,
          cat.rows[0]?.id ?? null,
        ],
      );
      const recipeId = inserted.rows[0].id;
      let order = 0;
      for (const ing of recipe.ingredients) {
        const foodMatch = await query(
          `SELECT ${c.foodId} AS id FROM ${t.food} WHERE LOWER(${c.foodName}) LIKE $1 LIMIT 1`,
          [`%${normalizeText(ing.ten)}%`],
        );
        await query(
          `INSERT INTO ${t.ingredient}
            (${c.recipeId}, ${c.foodId}, ${c.ingredientName}, ${c.quantity}, ${c.unit}, ${c.sortOrder})
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [recipeId, foodMatch.rows[0]?.id ?? null, ing.ten, ing.so_luong, ing.don_vi, order++],
        );
      }
    }
  }

  static async ensureNguoiDung({ email, fullName }) {
    const byEmail = await query(
      `SELECT ${c.userId} AS id FROM ${t.user} WHERE ${c.userEmail} = $1 LIMIT 1`,
      [email],
    );
    if (byEmail.rows[0]) return byEmail.rows[0].id;

    const giaDinhId = await FridgeItemModel.resolveGiaDinhId('family-1');
    const inserted = await query(
      `INSERT INTO ${t.user} (${c.familyId}, ho_ten, ${c.userEmail}, mat_khau)
       VALUES ($1, $2, $3, 'dev')
       RETURNING ${c.userId} AS id`,
      [giaDinhId, fullName || 'Dev User', email],
    );
    return inserted.rows[0].id;
  }

  static async loadIngredientCounts(recipeIds) {
    if (!recipeIds.length) return new Map();
    const result = await query(
      `SELECT ${c.recipeId}, COUNT(*)::int AS ingredient_count
       FROM ${t.ingredient}
       WHERE ${c.recipeId} = ANY($1::int[])
       GROUP BY ${c.recipeId}`,
      [recipeIds],
    );
    return new Map(result.rows.map((row) => [String(row.cong_thuc_id), Number(row.ingredient_count)]));
  }

  static async resolveUserId(userId) {
    const cacheKey = String(userId ?? '__anon__');
    if (resolvedUserCache.has(cacheKey)) return resolvedUserCache.get(cacheKey);

    const resolved = await this._resolveUserIdUncached(userId);
    resolvedUserCache.set(cacheKey, resolved);
    return resolved;
  }

  static async _resolveUserIdUncached(userId) {
    if (isNumericId(userId)) {
      const byId = await query(
        `SELECT ${c.userId} AS id FROM ${t.user} WHERE ${c.userId} = $1 LIMIT 1`,
        [Number(userId)],
      );
      if (byId.rows[0]) return byId.rows[0].id;

      const fromUsers = await query(
        'SELECT id, email, full_name FROM users WHERE id = $1 LIMIT 1',
        [Number(userId)],
      );
      if (fromUsers.rows[0]) {
        return this.ensureNguoiDung({
          email: fromUsers.rows[0].email,
          fullName: fromUsers.rows[0].full_name,
        });
      }
    }

    const shoppingUserId = await bridge.resolveShoppingUserId(userId);
    const fromUsers = await query(
      'SELECT id, email, full_name FROM users WHERE id = $1 LIMIT 1',
      [shoppingUserId],
    );
    if (fromUsers.rows[0]) {
      return this.ensureNguoiDung({
        email: fromUsers.rows[0].email,
        fullName: fromUsers.rows[0].full_name,
      });
    }

    const anyUser = await query('SELECT id, email, full_name FROM users ORDER BY id LIMIT 1');
    if (anyUser.rows[0]) {
      return this.ensureNguoiDung({
        email: anyUser.rows[0].email,
        fullName: anyUser.rows[0].full_name,
      });
    }

    throw new Error('Không tìm thấy người dùng. Vui lòng đăng nhập lại.');
  }

  static buildAccessClause(alias, userId, giaDinhId, params) {
    const parts = [`${alias}.${c.privacy} = 'SYSTEM'`];
    if (userId) {
      params.push(userId);
      parts.push(`(${alias}.${c.privacy} = 'PRIVATE' AND ${alias}.${c.creatorId} = $${params.length})`);
    }
    if (giaDinhId) {
      params.push(giaDinhId);
      parts.push(`(${alias}.${c.privacy} = 'FAMILY' AND ${alias}.${c.familyId} = $${params.length})`);
    }
    return `(${parts.join(' OR ')})`;
  }

  static async loadIngredients(recipeIds, userId = null) {
    if (!recipeIds.length) return new Map();
    const params = [recipeIds];
    let favoriteJoin = '';
    if (userId) {
      params.push(userId);
      favoriteJoin = '';
    }
    const result = await query(
      `SELECT nl.${c.ingredientId}, nl.${c.recipeId}, nl.${c.foodId}, nl.${c.ingredientName},
              nl.${c.quantity}, nl.${c.unit}, nl.${c.sortOrder}, tp.${c.foodName} AS ten_thuc_pham
       FROM ${t.ingredient} nl
       LEFT JOIN ${t.food} tp ON tp.${c.foodId} = nl.${c.foodId}
       WHERE nl.${c.recipeId} = ANY($1::int[])
       ORDER BY nl.${c.recipeId}, nl.${c.sortOrder}, nl.${c.ingredientId}`,
      params,
    );
    const map = new Map();
    for (const row of result.rows) {
      const key = String(row.cong_thuc_id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(mapIngredientRow(row));
    }
    return map;
  }

  static async attachFavorites(recipes, userId) {
    if (!userId || !recipes.length) return recipes;
    const ids = recipes.map((r) => Number(r.cong_thuc_id ?? r.id));
    const fav = await query(
      `SELECT ${c.recipeId} FROM ${t.favorite} WHERE ${c.userId} = $1 AND ${c.recipeId} = ANY($2::int[])`,
      [userId, ids],
    );
    const favSet = new Set(fav.rows.map((r) => String(r.cong_thuc_id)));
    return recipes.map((row) => ({ ...row, da_yeu_thich: favSet.has(String(row.cong_thuc_id)) }));
  }

  static async findPublic({ search, categoryId, limit = 50, offset = 0, lite = false }) {
    await this.ensureRecipeTables();
    const params = [];
    const where = [`ct.${c.privacy} = 'SYSTEM'`];
    if (search) {
      params.push(`%${search.trim()}%`);
      where.push(`(ct.${c.title} ILIKE $${params.length} OR ct.${c.description} ILIKE $${params.length})`);
    }
    if (categoryId && isNumericId(categoryId)) {
      params.push(Number(categoryId));
      where.push(`ct.${c.categoryId} = $${params.length}`);
    }
    params.push(limit, offset);
    const result = await query(
      `SELECT ct.*, dm.${c.categoryName} AS ten_danh_muc
       FROM ${t.recipe} ct
       LEFT JOIN ${t.recipeCategory} dm ON dm.${c.categoryPk} = ct.${c.categoryId}
       WHERE ${where.join(' AND ')}
       ORDER BY ct.${c.createdAt} DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    const recipeIds = result.rows.map((r) => r.cong_thuc_id);
    if (lite) {
      const countMap = await this.loadIngredientCounts(recipeIds);
      return result.rows.map((row) =>
        mapRecipeRow(row, [], countMap.get(String(row.cong_thuc_id)) ?? 0),
      );
    }
    const ingredientMap = await this.loadIngredients(recipeIds);
    return result.rows.map((row) =>
      mapRecipeRow(row, ingredientMap.get(String(row.cong_thuc_id)) || []),
    );
  }

  static async findPublicById(id) {
    await this.ensureRecipeTables();
    if (!isNumericId(id)) return null;
    const result = await query(
      `SELECT ct.*, dm.${c.categoryName} AS ten_danh_muc
       FROM ${t.recipe} ct
       LEFT JOIN ${t.recipeCategory} dm ON dm.${c.categoryPk} = ct.${c.categoryId}
       WHERE ct.${c.recipeId} = $1 AND ct.${c.privacy} = 'SYSTEM'`,
      [Number(id)],
    );
    if (!result.rows[0]) return null;
    const ingredients = await this.loadIngredients([Number(id)]);
    return mapRecipeRow(result.rows[0], ingredients.get(String(id)) || []);
  }

  static async findAccessible({
    userId, familyGroupId, search, categoryId, privacy, limit = 100, offset = 0, lite = false,
  }) {
    await this.ensureRecipeTables();
    const resolvedUserId = userId ? await this.resolveUserId(userId) : null;
    const giaDinhId = familyGroupId ? await FridgeItemModel.resolveGiaDinhId(familyGroupId) : null;
    const params = [];
    const where = [this.buildAccessClause('ct', resolvedUserId, giaDinhId, params)];
    if (search) {
      params.push(`%${search.trim()}%`);
      where.push(`(ct.${c.title} ILIKE $${params.length} OR ct.${c.description} ILIKE $${params.length})`);
    }
    if (categoryId && isNumericId(categoryId)) {
      params.push(Number(categoryId));
      where.push(`ct.${c.categoryId} = $${params.length}`);
    }
    if (privacy && ['SYSTEM', 'PRIVATE', 'FAMILY'].includes(privacy)) {
      params.push(privacy);
      where.push(`ct.${c.privacy} = $${params.length}`);
    }
    params.push(limit, offset);
    const result = await query(
      `SELECT ct.*, dm.${c.categoryName} AS ten_danh_muc
       FROM ${t.recipe} ct
       LEFT JOIN ${t.recipeCategory} dm ON dm.${c.categoryPk} = ct.${c.categoryId}
       WHERE ${where.join(' AND ')}
       ORDER BY ct.${c.createdAt} DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    let rows = result.rows;
    if (resolvedUserId) {
      rows = await this.attachFavorites(rows, resolvedUserId);
    }
    const recipeIds = rows.map((r) => r.cong_thuc_id);
    if (lite) {
      const countMap = await this.loadIngredientCounts(recipeIds);
      return rows.map((row) =>
        mapRecipeRow(row, [], countMap.get(String(row.cong_thuc_id)) ?? 0),
      );
    }
    const ingredientMap = await this.loadIngredients(recipeIds);
    return rows.map((row) =>
      mapRecipeRow(row, ingredientMap.get(String(row.cong_thuc_id)) || []),
    );
  }

  static async findByIdRaw(id) {
    if (!isNumericId(id)) return null;
    const result = await query(
      `SELECT ct.*, dm.${c.categoryName} AS ten_danh_muc
       FROM ${t.recipe} ct
       LEFT JOIN ${t.recipeCategory} dm ON dm.${c.categoryPk} = ct.${c.categoryId}
       WHERE ct.${c.recipeId} = $1`,
      [Number(id)],
    );
    if (!result.rows[0]) return null;
    const ingredients = await this.loadIngredients([Number(id)]);
    return mapRecipeRow(result.rows[0], ingredients.get(String(id)) || []);
  }

  static async findById({ id, userId, familyGroupId }) {
    await this.ensureRecipeTables();
    if (!isNumericId(id)) return null;
    const resolvedUserId = userId ? await this.resolveUserId(userId) : null;
    const giaDinhId = familyGroupId ? await FridgeItemModel.resolveGiaDinhId(familyGroupId) : null;
    const params = [Number(id)];
    const access = this.buildAccessClause('ct', resolvedUserId, giaDinhId, params);
    const result = await query(
      `SELECT ct.*, dm.${c.categoryName} AS ten_danh_muc
       FROM ${t.recipe} ct
       LEFT JOIN ${t.recipeCategory} dm ON dm.${c.categoryPk} = ct.${c.categoryId}
       WHERE ct.${c.recipeId} = $1 AND ${access}`,
      params,
    );
    if (!result.rows[0]) return null;
    let row = result.rows[0];
    if (resolvedUserId) {
      const fav = await query(
        `SELECT 1 FROM ${t.favorite} WHERE ${c.userId} = $1 AND ${c.recipeId} = $2 LIMIT 1`,
        [resolvedUserId, Number(id)],
      );
      row = { ...row, da_yeu_thich: fav.rows.length > 0 };
    }
    const ingredients = await this.loadIngredients([Number(id)]);
    return mapRecipeRow(row, ingredients.get(String(id)) || []);
  }

  static async getCategories() {
    await this.ensureRecipeTables();
    const result = await query(
      `SELECT ${c.categoryPk} AS id, ${c.categoryName} AS ten FROM ${t.recipeCategory} ORDER BY ${c.categoryName}`,
    );
    return result.rows.map((row) => ({ id: String(row.id), ten: row.ten }));
  }

  static async create({ userId, familyGroupId, data }) {
    await this.ensureRecipeTables();
    const resolvedUserId = await this.resolveUserId(userId);
    const privacy = data.loai_quyen || 'PRIVATE';
    if (!['PRIVATE', 'FAMILY'].includes(privacy)) {
      throw new Error('Chỉ có thể tạo công thức PRIVATE hoặc FAMILY');
    }
    let giaDinhId = null;
    if (privacy === 'FAMILY') {
      giaDinhId = await FridgeItemModel.resolveGiaDinhId(familyGroupId || data.gia_dinh_id);
      if (!giaDinhId) throw new Error('Thiếu gia đình cho công thức FAMILY');
    }

    const inserted = await query(
      `INSERT INTO ${t.recipe}
        (${c.title}, ${c.description}, ${c.instructions}, ${c.timeMinutes}, ${c.servings},
         ${c.imageUrl}, ${c.categoryId}, ${c.creatorId}, ${c.privacy}, ${c.familyId})
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${c.recipeId} AS id`,
      [
        data.tieu_de,
        data.mo_ta || null,
        data.huong_dan,
        data.thoi_gian_phut ?? 30,
        data.khau_phan ?? 2,
        data.hinh_anh_url || null,
        data.danh_muc_id ? Number(data.danh_muc_id) : null,
        resolvedUserId,
        privacy,
        giaDinhId,
      ],
    );
    const recipeId = inserted.rows[0]?.id;
    if (!recipeId) throw new Error('Không tạo được công thức.');
    await this.replaceIngredients(recipeId, data.nguyen_lieu || []);
    const recipe = await this.findById({ id: recipeId, userId, familyGroupId });
    if (recipe) return recipe;
    return this.findByIdRaw(recipeId);
  }

  static async replaceIngredients(recipeId, ingredients) {
    await query(`DELETE FROM ${t.ingredient} WHERE ${c.recipeId} = $1`, [recipeId]);
    let order = 0;
    for (const ing of ingredients) {
      const name = ing.ten_nguyen_lieu || ing.ten || ing.name;
      if (!name) continue;
      let foodId = ing.thuc_pham_id ? Number(ing.thuc_pham_id) : null;
      if (!foodId) {
        const match = await query(
          `SELECT ${c.foodId} AS id FROM ${t.food} WHERE LOWER(${c.foodName}) LIKE $1 LIMIT 1`,
          [`%${normalizeText(name)}%`],
        );
        foodId = match.rows[0]?.id ?? null;
      }
      await query(
        `INSERT INTO ${t.ingredient}
          (${c.recipeId}, ${c.foodId}, ${c.ingredientName}, ${c.quantity}, ${c.unit}, ${c.sortOrder})
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          recipeId,
          foodId,
          name,
          ing.so_luong ?? ing.quantity ?? null,
          ing.don_vi || ing.unit || null,
          order++,
        ],
      );
    }
  }

  static async update({ id, userId, familyGroupId, data }) {
    await this.ensureRecipeTables();
    if (!isNumericId(id)) return null;
    const existing = await this.findById({ id, userId, familyGroupId });
    if (!existing) return null;
    if (existing.loai_quyen === 'SYSTEM') {
      throw new Error('Không thể sửa công thức hệ thống');
    }
    const resolvedUserId = await this.resolveUserId(userId);
    if (existing.loai_quyen === 'PRIVATE' && String(existing.nguoi_tao_id) !== String(resolvedUserId)) {
      throw new Error('Không có quyền sửa công thức này');
    }

    const privacy = data.loai_quyen || existing.loai_quyen;
    let giaDinhId = existing.gia_dinh_id ? Number(existing.gia_dinh_id) : null;
    if (privacy === 'FAMILY') {
      giaDinhId = await FridgeItemModel.resolveGiaDinhId(familyGroupId || data.gia_dinh_id);
    } else if (privacy === 'PRIVATE') {
      giaDinhId = null;
    }

    await query(
      `UPDATE ${t.recipe}
       SET ${c.title} = COALESCE($2, ${c.title}),
           ${c.description} = COALESCE($3, ${c.description}),
           ${c.instructions} = COALESCE($4, ${c.instructions}),
           ${c.timeMinutes} = COALESCE($5, ${c.timeMinutes}),
           ${c.servings} = COALESCE($6, ${c.servings}),
           ${c.imageUrl} = COALESCE($7, ${c.imageUrl}),
           ${c.categoryId} = COALESCE($8, ${c.categoryId}),
           ${c.privacy} = $9,
           ${c.familyId} = $10,
           ${c.updatedAt} = NOW()
       WHERE ${c.recipeId} = $1`,
      [
        Number(id),
        data.tieu_de ?? null,
        data.mo_ta ?? null,
        data.huong_dan ?? null,
        data.thoi_gian_phut ?? null,
        data.khau_phan ?? null,
        data.hinh_anh_url ?? null,
        data.danh_muc_id ? Number(data.danh_muc_id) : null,
        privacy,
        giaDinhId,
      ],
    );
    if (data.nguyen_lieu) {
      await this.replaceIngredients(Number(id), data.nguyen_lieu);
    }
    return this.findById({ id, userId, familyGroupId });
  }

  static async remove({ id, userId, familyGroupId }) {
    await this.ensureRecipeTables();
    if (!isNumericId(id)) return false;
    const existing = await this.findById({ id, userId, familyGroupId });
    if (!existing) return false;
    if (existing.loai_quyen === 'SYSTEM') {
      throw new Error('Không thể xóa công thức hệ thống');
    }
    const resolvedUserId = await this.resolveUserId(userId);
    if (existing.loai_quyen === 'PRIVATE' && String(existing.nguoi_tao_id) !== String(resolvedUserId)) {
      throw new Error('Không có quyền xóa công thức này');
    }
    await query(`DELETE FROM ${t.recipe} WHERE ${c.recipeId} = $1`, [Number(id)]);
    return true;
  }

  static async getFridgeStock(giaDinhId) {
    const fridgeId = await FridgeItemModel.resolveFridgeId(giaDinhId);
    const result = await query(
      `SELECT ctd.${c.fridgeItemId}, ctd.${c.quantity}, ctd.${c.foodId}, tp.${c.foodName}
       FROM ${t.fridgeItem} ctd
       JOIN ${t.fridge} tl ON tl.${c.fridgeId} = ctd.${c.fridgeId}
       LEFT JOIN ${t.food} tp ON tp.${c.foodId} = ctd.${c.foodId}
       WHERE tl.${c.familyId} = $1 AND ctd.${c.quantity} > 0`,
      [giaDinhId],
    );
    const byFoodId = new Map();
    const byName = new Map();
    for (const row of result.rows) {
      if (row.thuc_pham_id) {
        const key = String(row.thuc_pham_id);
        const prev = byFoodId.get(key) || 0;
        byFoodId.set(key, prev + Number(row.so_luong || 0));
      }
      const nameKey = normalizeText(row.ten_thuc_pham);
      if (nameKey) {
        const prev = byName.get(nameKey) || 0;
        byName.set(nameKey, prev + Number(row.so_luong || 0));
      }
    }
    return { byFoodId, byName, rows: result.rows };
  }

  static ingredientNameKeys(ingredient) {
    const keys = new Set();
    const primary = normalizeText(ingredient.ten_thuc_pham || ingredient.ten_nguyen_lieu);
    if (primary) keys.add(primary);
    const alias = normalizeText(ingredient.ten_nguyen_lieu);
    if (alias) keys.add(alias);
    return [...keys];
  }

  static matchIngredientStock(ingredient, stock) {
    const needQty = Number(ingredient.so_luong) || 1;
    if (ingredient.thuc_pham_id) {
      const available = stock.byFoodId.get(String(ingredient.thuc_pham_id)) || 0;
      if (available >= needQty) return { available: true, availableQty: available, needQty };
    }
    let bestQty = 0;
    for (const nameKey of this.ingredientNameKeys(ingredient)) {
      const exact = stock.byName.get(nameKey) || 0;
      bestQty = Math.max(bestQty, exact);
      if (exact >= needQty) return { available: true, availableQty: exact, needQty };
      for (const [name, qty] of stock.byName.entries()) {
        if (name.includes(nameKey) || nameKey.includes(name)) {
          bestQty = Math.max(bestQty, qty);
          if (qty >= needQty) return { available: true, availableQty: qty, needQty };
        }
      }
    }
    return { available: false, availableQty: bestQty, needQty };
  }

  static async suggestFromFridge({ userId, familyGroupId, limit = 20 }) {
    await this.ensureRecipeTables();
    const giaDinhId = await FridgeItemModel.resolveGiaDinhId(familyGroupId);
    const stock = await this.getFridgeStock(giaDinhId);
    const recipes = await this.findAccessible({ userId, familyGroupId, limit: 25 });
    const suggestions = recipes.map((recipe) => {
      const availableFoodIds = [];
      const missing = [];
      for (const ing of recipe.nguyen_lieu) {
        const match = this.matchIngredientStock(ing, stock);
        if (match.available) {
          if (ing.thuc_pham_id) availableFoodIds.push(String(ing.thuc_pham_id));
        } else {
          missing.push({
            food_id: ing.thuc_pham_id || `ing-${ing.id}`,
            food_name: ing.ten_thuc_pham || ing.ten_nguyen_lieu,
            quantity: match.needQty,
            unit: ing.don_vi || 'g',
          });
        }
      }
      return {
        recipe,
        match_count: recipe.nguyen_lieu.length - missing.length,
        missing_count: missing.length,
        available_food_ids: availableFoodIds,
        missing,
      };
    });
    return suggestions
      .sort((a, b) => a.missing_count - b.missing_count || b.match_count - a.match_count)
      .slice(0, limit);
  }

  static async addFavorite({ userId, recipeId }) {
    await this.ensureRecipeTables();
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId || !isNumericId(recipeId)) return false;
    await query(
      `INSERT INTO ${t.favorite} (${c.userId}, ${c.recipeId}) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [resolvedUserId, Number(recipeId)],
    );
    return true;
  }

  static async removeFavorite({ userId, recipeId }) {
    await this.ensureRecipeTables();
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId || !isNumericId(recipeId)) return false;
    await query(
      `DELETE FROM ${t.favorite} WHERE ${c.userId} = $1 AND ${c.recipeId} = $2`,
      [resolvedUserId, Number(recipeId)],
    );
    return true;
  }

  static async findFavorites({ userId, familyGroupId, limit = 100 }) {
    await this.ensureRecipeTables();
    const resolvedUserId = await this.resolveUserId(userId);
    if (!resolvedUserId) return [];

    const giaDinhId = familyGroupId ? await FridgeItemModel.resolveGiaDinhId(familyGroupId) : null;
    const accessParams = [];
    const access = this.buildAccessClause('ct', resolvedUserId, giaDinhId, accessParams);
    const params = [resolvedUserId, ...accessParams];
    const accessSql = access.replace(/\$(\d+)/g, (_, num) => `$${Number(num) + 1}`);

    const result = await query(
      `SELECT ct.*, dm.${c.categoryName} AS ten_danh_muc, TRUE AS da_yeu_thich
       FROM ${t.favorite} fav
       JOIN ${t.recipe} ct ON ct.${c.recipeId} = fav.${c.recipeId}
       LEFT JOIN ${t.recipeCategory} dm ON dm.${c.categoryPk} = ct.${c.categoryId}
       WHERE fav.${c.userId} = $1 AND ${accessSql}
       ORDER BY fav.ngay_tao DESC
       LIMIT ${Number(limit) || 100}`,
      params,
    );

    const ingredientMap = await this.loadIngredients(result.rows.map((r) => r.cong_thuc_id));
    return result.rows.map((row) =>
      mapRecipeRow(row, ingredientMap.get(String(row.cong_thuc_id)) || []),
    );
  }

  static buildMissingItems(recipe, stock) {
    const missing = [];
    const availableFoodIds = [];
    for (const ing of recipe.nguyen_lieu) {
      const match = this.matchIngredientStock(ing, stock);
      if (match.available) {
        if (ing.thuc_pham_id) availableFoodIds.push(String(ing.thuc_pham_id));
      } else {
        const shortfall = Math.max(0, match.needQty - match.availableQty);
        missing.push({
          food_id: ing.thuc_pham_id || `ing-${ing.id}`,
          food_name: (ing.ten_thuc_pham || ing.ten_nguyen_lieu || 'Nguyên liệu').trim(),
          quantity: shortfall > 0 ? shortfall : match.needQty,
          unit: ing.don_vi || 'g',
        });
      }
    }
    return { missing, available_food_ids: availableFoodIds };
  }

  static async getMissingForRecipe({ recipeId, userId, familyGroupId }) {
    await this.ensureRecipeTables();
    const recipe = await this.findById({ id: recipeId, userId, familyGroupId });
    if (!recipe) return null;
    const giaDinhId = await FridgeItemModel.resolveGiaDinhId(familyGroupId);
    const stock = await this.getFridgeStock(giaDinhId);
    return {
      recipe,
      ...this.buildMissingItems(recipe, stock),
    };
  }

  static findMatchingFridgeRows(ingredient, stockRows) {
    const needQty = Number(ingredient.so_luong) || 1;
    const nameKeys = this.ingredientNameKeys(ingredient);
    const matches = stockRows.filter((row) => {
      if (ingredient.thuc_pham_id && String(row.thuc_pham_id) === String(ingredient.thuc_pham_id)) {
        return true;
      }
      const rowName = normalizeText(row.ten_thuc_pham);
      return nameKeys.some(
        (key) => rowName === key || rowName.includes(key) || key.includes(rowName),
      );
    });
    return { matches, needQty };
  }

  static totalAvailableForIngredient(ingredient, stockRows) {
    const { matches } = this.findMatchingFridgeRows(ingredient, stockRows);
    return matches.reduce((sum, row) => sum + Number(row.so_luong || 0), 0);
  }

  static async markCooked({ recipeId, userId, familyGroupId }) {
    await this.ensureRecipeTables();
    const recipe = await this.findById({ id: recipeId, userId, familyGroupId });
    if (!recipe) throw new Error('Không tìm thấy công thức');

    const giaDinhId = await FridgeItemModel.resolveGiaDinhId(familyGroupId);
    const stock = await this.getFridgeStock(giaDinhId);
    const shortages = [];

    for (const ing of recipe.nguyen_lieu) {
      const needQty = Number(ing.so_luong) || 1;
      const available = this.totalAvailableForIngredient(ing, stock.rows);
      if (available < needQty) {
        shortages.push({
          name: ing.ten_thuc_pham || ing.ten_nguyen_lieu,
          need: needQty,
          have: available,
          unit: ing.don_vi || 'g',
        });
      }
    }

    if (shortages.length) {
      const detail = shortages
        .map((s) => `${s.name} (cần ${s.need} ${s.unit}, có ${s.have} ${s.unit})`)
        .join('; ');
      throw new Error(`Không đủ nguyên liệu trong tủ lạnh: ${detail}`);
    }

    const updates = [];
    for (const ing of recipe.nguyen_lieu) {
      let remaining = Number(ing.so_luong) || 1;
      const { matches } = this.findMatchingFridgeRows(ing, stock.rows);
      for (const row of matches) {
        if (remaining <= 0) break;
        const available = Number(row.so_luong) || 0;
        if (available <= 0) continue;
        const useQty = Math.min(remaining, available);
        const updated = await FridgeItemModel.updateQuantity(
          row.chi_tiet_id,
          useQty,
          'use',
          userId,
          familyGroupId,
        );
        if (updated) {
          updates.push({ ingredient: ing.ten_nguyen_lieu, quantity: useQty });
          remaining -= useQty;
          row.so_luong = available - useQty;
        }
      }
      if (remaining > 0) {
        throw new Error(`Không thể trừ đủ nguyên liệu: ${ing.ten_nguyen_lieu}`);
      }
    }

    return { recipe_id: String(recipeId), updates, shortages: [] };
  }

  static async createShoppingListFromRecipe({ recipeId, userId, familyGroupId, title }) {
    const missingData = await this.getMissingForRecipe({ recipeId, userId, familyGroupId });
    if (!missingData) throw new Error('Không tìm thấy công thức');
    if (!missingData.missing.length) {
      throw new Error('Không thiếu nguyên liệu để tạo danh sách mua');
    }

    const ShoppingService = require('../services/ShoppingService');
    const bridge = require('../utils/shoppingBridge');
    const resolvedUserId = await bridge.resolveShoppingUserId(userId);
    const familyId = await bridge.resolveShoppingGroupId(familyGroupId);

    const items = [];
    for (const row of missingData.missing) {
      const foodId = await bridge.resolveOrCreateFood({
        thuc_pham_id: /^\d+$/.test(String(row.food_id)) ? row.food_id : null,
        food_name: row.food_name,
        unit: row.unit,
      });
      const unitId = await bridge.getDefaultUnitId(row.unit);
      const categoryId = await bridge.getDefaultCategoryId();
      items.push({
        food_id: String(foodId),
        food_name: row.food_name || `Mặt hàng #${foodId}`,
        quantity: Number(row.quantity) || 1,
        unit_id: unitId,
        category_id: categoryId,
      });
    }

    const list = await ShoppingService.createList({
      userId: resolvedUserId,
      familyId,
      name: title || `Mua thêm cho: ${missingData.recipe.tieu_de}`,
      listType: 'daily',
      planDate: new Date().toISOString().slice(0, 10),
      items,
    });

    return {
      shopping_list_id: String(list.shopping_list_id || list.id),
      title: list.name || title,
      recipe: missingData.recipe,
      missing: missingData.missing,
      list,
    };
  }
}

module.exports = RecipeModel;
