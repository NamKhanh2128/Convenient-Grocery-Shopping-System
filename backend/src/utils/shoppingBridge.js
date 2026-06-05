const { query } = require('../config/db');
const FridgeItemModel = require('../models/FridgeItemModel');
const ShoppingModel = require('../models/ShoppingModel');

const groupIdCache = new Map();
const defaultUnitIdCache = new Map();
let defaultCategoryIdCache = null;

const UNIT_SYMBOLS = {
  kg: 'kg',
  g: 'g',
  lít: 'l',
  ml: 'ml',
  quả: 'pcs',
  củ: 'pcs',
  miếng: 'pcs',
  gói: 'pack',
};

async function resolveShoppingUserId(userId) {
  if (/^\d+$/.test(String(userId ?? ''))) {
    const found = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [Number(userId)]);
    if (found.rows[0]) return found.rows[0].id;
  }
  const any = await query('SELECT id FROM users ORDER BY id LIMIT 1');
  return any.rows[0]?.id ?? 1;
}

async function resolveShoppingGroupId(familyGroupId) {
  const cacheKey = String(familyGroupId ?? '');
  if (groupIdCache.has(cacheKey)) return groupIdCache.get(cacheKey);

  const giaDinhId = await FridgeItemModel.resolveGiaDinhId(familyGroupId);

  const byId = await query('SELECT id FROM family_groups WHERE id = $1 LIMIT 1', [giaDinhId]);
  if (byId.rows[0]) {
    groupIdCache.set(cacheKey, byId.rows[0].id);
    return byId.rows[0].id;
  }

  const giaDinh = await query('SELECT ten_gia_dinh FROM gia_dinh WHERE gia_dinh_id = $1 LIMIT 1', [giaDinhId]);
  const familyName = giaDinh.rows[0]?.ten_gia_dinh || 'Gia đình NATEAT';

  const byName = await query('SELECT id FROM family_groups WHERE name = $1 LIMIT 1', [familyName]);
  if (byName.rows[0]) {
    await ensureGroupMember(byName.rows[0].id, await resolveShoppingUserId(null));
    groupIdCache.set(cacheKey, byName.rows[0].id);
    return byName.rows[0].id;
  }

  const userId = await resolveShoppingUserId(null);
  const created = await query(
    'INSERT INTO family_groups (name, created_by) VALUES ($1, $2) RETURNING id',
    [familyName, userId],
  );
  const groupId = created.rows[0].id;
  await ensureGroupMember(groupId, userId);
  groupIdCache.set(cacheKey, groupId);
  return groupId;
}

async function ensureGroupMember(groupId, userId) {
  const existing = await query(
    'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 LIMIT 1',
    [groupId, userId],
  );
  if (existing.rows[0]) return;
  await query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId, userId]);
}

async function getDefaultUnitId(unitSymbol) {
  const symbol = UNIT_SYMBOLS[unitSymbol] || unitSymbol || 'g';
  if (defaultUnitIdCache.has(symbol)) return defaultUnitIdCache.get(symbol);
  const bySymbol = await query('SELECT id FROM units WHERE symbol = $1 OR name = $1 LIMIT 1', [symbol]);
  if (bySymbol.rows[0]) {
    defaultUnitIdCache.set(symbol, bySymbol.rows[0].id);
    return bySymbol.rows[0].id;
  }
  const any = await query('SELECT id FROM units ORDER BY id LIMIT 1');
  const id = any.rows[0]?.id ?? 1;
  defaultUnitIdCache.set(symbol, id);
  return id;
}

async function getDefaultCategoryId() {
  if (defaultCategoryIdCache != null) return defaultCategoryIdCache;
  const any = await query('SELECT id FROM food_categories ORDER BY id LIMIT 1');
  defaultCategoryIdCache = any.rows[0]?.id ?? 1;
  return defaultCategoryIdCache;
}

async function resolveOrCreateFood({ thuc_pham_id, food_name, unit }) {
  let name = String(food_name || '').trim();
  if (thuc_pham_id && /^\d+$/.test(String(thuc_pham_id))) {
    const foodById = await query('SELECT id, food_name FROM foods WHERE id = $1 LIMIT 1', [Number(thuc_pham_id)]);
    if (foodById.rows[0]) return foodById.rows[0].id;

    const thucPham = await query('SELECT ten_thuc_pham FROM thuc_pham WHERE thuc_pham_id = $1 LIMIT 1', [
      Number(thuc_pham_id),
    ]);
    if (thucPham.rows[0]?.ten_thuc_pham) name = thucPham.rows[0].ten_thuc_pham;
  }
  if (!name) throw new Error('Thiếu tên thực phẩm để thêm vào danh sách mua.');

  const existing = await ShoppingModel.findFoodByName(name);
  if (existing) return existing.id;

  const unitId = await getDefaultUnitId(unit);
  const categoryId = await getDefaultCategoryId();
  return ShoppingModel.insertFood({ foodName: name, unitId, categoryId });
}

module.exports = {
  resolveShoppingUserId,
  resolveShoppingGroupId,
  getDefaultUnitId,
  getDefaultCategoryId,
  resolveOrCreateFood,
};
