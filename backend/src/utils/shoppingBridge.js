const { query } = require('../config/db');
const ShoppingModel = require('../models/ShoppingModel');
const { normalizeUnitName } = require('../config/unitsConfig');

const groupIdCache = new Map();
const defaultUnitIdCache = new Map();
let defaultCategoryIdCache = null;

async function resolveShoppingUserId(userId) {
  if (/^\d+$/.test(String(userId ?? ''))) {
    const found = await query('SELECT id FROM users WHERE id = $1 LIMIT 1', [Number(userId)]);
    if (found.rows[0]) return found.rows[0].id;
  }
  const any = await query('SELECT id FROM users ORDER BY id LIMIT 1');
  return any.rows[0]?.id ?? 1;
}

async function ensureGroupMember(groupId, userId) {
  const existing = await query('SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2 LIMIT 1', [groupId, userId]);
  if (existing.rows[0]) return;
  await query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [groupId, userId]);
}

async function resolveShoppingGroupId(familyGroupId) {
  const cacheKey = String(familyGroupId ?? '');
  if (groupIdCache.has(cacheKey)) return groupIdCache.get(cacheKey);

  if (/^\d+$/.test(cacheKey)) {
    const byId = await query('SELECT id FROM family_groups WHERE id = $1 LIMIT 1', [Number(cacheKey)]);
    if (byId.rows[0]) {
      groupIdCache.set(cacheKey, byId.rows[0].id);
      return byId.rows[0].id;
    }
  }

  const userId = await resolveShoppingUserId(null);
  const existing = await query('SELECT id FROM family_groups ORDER BY id LIMIT 1');
  if (existing.rows[0]) {
    await ensureGroupMember(existing.rows[0].id, userId);
    groupIdCache.set(cacheKey, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const created = await query('INSERT INTO family_groups (name, created_by) VALUES ($1, $2) RETURNING id', ['Gia đình NATEAT', userId]);
  const groupId = created.rows[0].id;
  await ensureGroupMember(groupId, userId);
  groupIdCache.set(cacheKey, groupId);
  return groupId;
}

// Resolves to a unit id. Checks for an exact existing match first since
// units are admin-extensible (custom units shouldn't fall back to "miếng").
async function getDefaultUnitId(unitInput) {
  const raw = String(unitInput || '').trim().toLowerCase();
  if (raw) {
    if (defaultUnitIdCache.has(raw)) return defaultUnitIdCache.get(raw);
    const exact = await query('SELECT id FROM units WHERE lower(name) = lower($1) LIMIT 1', [raw]);
    if (exact.rows[0]) {
      defaultUnitIdCache.set(raw, exact.rows[0].id);
      return exact.rows[0].id;
    }
  }

  const canonicalName = normalizeUnitName(unitInput);
  if (defaultUnitIdCache.has(canonicalName)) return defaultUnitIdCache.get(canonicalName);
  const found = await query('SELECT id FROM units WHERE lower(name) = lower($1) LIMIT 1', [canonicalName]);
  if (found.rows[0]) {
    defaultUnitIdCache.set(canonicalName, found.rows[0].id);
    return found.rows[0].id;
  }
  const created = await query('INSERT INTO units (name, symbol) VALUES ($1, $1) RETURNING id', [canonicalName]);
  defaultUnitIdCache.set(canonicalName, created.rows[0].id);
  return created.rows[0].id;
}

async function getDefaultCategoryId() {
  if (defaultCategoryIdCache != null) return defaultCategoryIdCache;
  const any = await query('SELECT id FROM food_categories ORDER BY id LIMIT 1');
  if (any.rows[0]) {
    defaultCategoryIdCache = any.rows[0].id;
    return defaultCategoryIdCache;
  }
  const created = await query("INSERT INTO food_categories (name_vi, name_en) VALUES ('Khác', 'Other') RETURNING id");
  defaultCategoryIdCache = created.rows[0].id;
  return defaultCategoryIdCache;
}

async function resolveOrCreateFood({ thuc_pham_id, food_name, unit }) {
  const numericId = /^\d+$/.test(String(thuc_pham_id ?? '')) ? Number(thuc_pham_id) : null;
  if (numericId) {
    const foodById = await query('SELECT id FROM foods WHERE id = $1 LIMIT 1', [numericId]);
    if (foodById.rows[0]) return foodById.rows[0].id;
  }

  const name = String(food_name || '').trim();
  if (!name) throw new Error('Missing food name for shopping list item.');
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
