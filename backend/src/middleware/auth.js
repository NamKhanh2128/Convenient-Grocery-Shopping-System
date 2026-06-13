const jwt = require('jsonwebtoken');
const bridge = require('../utils/shoppingBridge');
const { query } = require('../config/db');
const ShoppingModel = require('../models/ShoppingModel');
const FridgeItemModel = require('../models/FridgeItemModel');

// Cached entries carry an expiry so that family-membership changes (join /
// leave / transfer) are picked up within AUTH_USER_CACHE_TTL_MS instead of
// living forever until the next server restart.
const USER_CACHE_TTL_MS = Number(process.env.AUTH_USER_CACHE_TTL_MS || 60000);
const mockUserCache = new Map();
const jwtUserCache = new Map();

function getCachedUser(cache, key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCachedUser(cache, key, value) {
  cache.set(key, { value, expiresAt: Date.now() + USER_CACHE_TTL_MS });
  return value;
}

async function resolveMockUser(token) {
  const cached = getCachedUser(mockUserCache, token);
  if (cached) return cached;
  const mockId = token.slice('mock-token-'.length);
  const user_id = await bridge.resolveShoppingUserId(mockId);
  const family_id = await bridge.resolveShoppingGroupId('family-1');
  const gia_dinh_id = await FridgeItemModel.resolveGiaDinhId('family-1');

  // Role must be looked up from the database. Mock tokens must NEVER
  // be granted ADMIN access by default - that is a privilege escalation.
  const { rows } = await query(
    'SELECT email, full_name, role FROM users WHERE id = $1 LIMIT 1',
    [user_id]
  );
  const dbUser = rows[0];

  const user = {
    user_id,
    id: user_id,
    family_id,
    family_group_id: family_id,
    gia_dinh_id,
    email: dbUser?.email || 'dev@nateat.vn',
    full_name: dbUser?.full_name || 'Dev User',
    role: String(dbUser?.role || 'user').toUpperCase(),
  };
  return setCachedUser(mockUserCache, token, user);
}

async function enrichJwtUser(decoded) {
  const cacheKey = String(decoded.user_id ?? decoded.id ?? decoded.sub ?? '');
  const cached = getCachedUser(jwtUserCache, cacheKey);
  if (cached) return cached;

  const user_id = decoded.user_id ?? decoded.id;
  let family_id = decoded.family_id ?? decoded.family_group_id ?? null;
  if (!family_id && user_id) {
    family_id = await ShoppingModel.getUserFamilyId(user_id);
  }
  if (!family_id) {
    const giaDinhId = await FridgeItemModel.resolveGiaDinhId('family-1');
    family_id = await bridge.resolveShoppingGroupId(String(giaDinhId));
  }
  const gia_dinh_id = await FridgeItemModel.resolveGiaDinhId(family_id);
  const user = {
    ...decoded,
    user_id,
    id: user_id,
    family_id,
    family_group_id: family_id,
    gia_dinh_id,
  };
  return setCachedUser(jwtUserCache, cacheKey, user);
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Chưa đăng nhập hoặc phiên đã hết hạn.' });
  }
  const token = header.split(' ')[1];

  if (token.startsWith('mock-token-')) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ message: 'Token mock không được phép trong môi trường production.' });
    }
    resolveMockUser(token)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch(() => res.status(401).json({ message: 'Token mock không hợp lệ.' }));
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_ACCESS || process.env.JWT_SECRET || 'dev-secret-change-me'
    );
    enrichJwtUser(decoded)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch(() => res.status(401).json({ message: 'Không xác định được nhóm gia đình.' }));
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

module.exports = { authRequired };
