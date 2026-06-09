const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authSchema } = require('../config/authSchema');
const { pool } = require('../config/db');

const MISSING_INFO_MESSAGE = 'Vui lòng nhập đầy đủ thông tin';
const INVALID_TOKEN_MESSAGE = 'Token không hợp lệ hoặc đã hết hạn';
const DEFAULT_ACCESS_EXPIRES_IN = '15m';
const DEFAULT_REFRESH_EXPIRES_IN = '7d';
const u = authSchema.user;

function isBlank(value) {
  return !String(value || '').trim();
}

function getRequiredEnv(name, fallbackName) {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function normalizeUser(row) {
  if (!row) return null;

  return {
    user_id: String(row.user_id),
    full_name: row.full_name,
    email: row.email,
    role: String(row.role || 'USER').toUpperCase(),
  };
}

async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT
      ${u.id} AS user_id,
      ${u.fullName} AS full_name,
      ${u.email} AS email,
      ${u.password} AS password,
      ${u.role} AS role
     FROM ${u.table}
     WHERE lower(${u.email}) = lower($1)
     LIMIT 1`,
    [email]
  );

  const user = normalizeUser(rows[0]);
  return user ? { ...user, password: rows[0].password } : null;
}

async function findUserById(userId) {
  const { rows } = await pool.query(
    `SELECT
      ${u.id} AS user_id,
      ${u.fullName} AS full_name,
      ${u.email} AS email,
      ${u.role} AS role
     FROM ${u.table}
     WHERE ${u.id}::text = $1
     LIMIT 1`,
    [String(userId)]
  );

  return normalizeUser(rows[0]);
}

async function createUser({ fullName, email, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO ${u.table} (${u.fullName}, ${u.email}, ${u.password}, ${u.role})
     VALUES ($1, $2, $3, 'user')
     RETURNING
      ${u.id} AS user_id,
      ${u.fullName} AS full_name,
      ${u.email} AS email,
      ${u.role} AS role`,
    [fullName, email, passwordHash]
  );

  return normalizeUser(rows[0]);
}

async function createRefreshToken({ userId, token, expiresAt }) {
  const { rows } = await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, token, created_at, expires_at, revoked`,
    [userId, token, expiresAt]
  );

  return rows[0] || null;
}

async function findRefreshToken(token) {
  const { rows } = await pool.query(
    `SELECT id, user_id, token, created_at, expires_at, revoked
     FROM refresh_tokens
     WHERE token = $1
     LIMIT 1`,
    [token]
  );

  return rows[0] || null;
}

async function revokeRefreshToken(token) {
  const { rows } = await pool.query(
    `UPDATE refresh_tokens
     SET revoked = true
     WHERE token = $1
     RETURNING id, user_id, token, created_at, expires_at, revoked`,
    [token]
  );

  return rows[0] || null;
}

const authTokenService = {
  createAccessToken(user) {
    return jwt.sign(
      {
        user_id: String(user.user_id),
        email: user.email,
        role: user.role,
      },
      getRequiredEnv('JWT_SECRET_ACCESS', 'JWT_SECRET'),
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || DEFAULT_ACCESS_EXPIRES_IN }
    );
  },

  createRefreshToken(user) {
    return jwt.sign(
      {
        user_id: String(user.user_id),
        email: user.email,
        role: user.role,
      },
      getRequiredEnv('JWT_SECRET_REFRESH', 'JWT_SECRET'),
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || DEFAULT_REFRESH_EXPIRES_IN }
    );
  },

  getRefreshTokenExpiresAt(refreshToken) {
    const decoded = jwt.verify(refreshToken, getRequiredEnv('JWT_SECRET_REFRESH', 'JWT_SECRET'));
    return decoded.exp ? new Date(decoded.exp * 1000) : null;
  },

  verifyAccessToken(accessToken) {
    return jwt.verify(accessToken, getRequiredEnv('JWT_SECRET_ACCESS', 'JWT_SECRET'));
  },

  verifyRefreshToken(refreshToken) {
    return jwt.verify(refreshToken, getRequiredEnv('JWT_SECRET_REFRESH', 'JWT_SECRET'));
  },
};

const authService = {
  async register({ full_name, email, password }) {
    if (isBlank(full_name) || isBlank(email) || isBlank(password)) {
      return { status: 400, body: { message: MISSING_INFO_MESSAGE } };
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return { status: 409, body: { message: 'Email đã tồn tại' } };
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await createUser({
      fullName: String(full_name).trim(),
      email: normalizedEmail,
      passwordHash,
    });

    return { status: 201, body: { message: 'Đăng ký thành công', user } };
  },

  async login({ email, password }) {
    if (isBlank(email) || isBlank(password)) {
      return { status: 400, body: { message: MISSING_INFO_MESSAGE } };
    }

    const user = await findUserByEmail(String(email).trim().toLowerCase());
    if (!user) {
      return { status: 404, body: { message: 'Tài khoản không tồn tại' } };
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      return { status: 401, body: { message: 'Mật khẩu không đúng' } };
    }

    const { password: _password, ...safeUser } = user;
    const accessToken = authTokenService.createAccessToken(safeUser);
    const refreshToken = authTokenService.createRefreshToken(safeUser);
    const expiresAt = authTokenService.getRefreshTokenExpiresAt(refreshToken);

    await createRefreshToken({
      userId: safeUser.user_id,
      token: refreshToken,
      expiresAt,
    });

    return {
      status: 200,
      body: {
        message: 'Đăng nhập thành công',
        accessToken,
        refreshToken,
        user: safeUser,
      },
    };
  },

  async refresh(refreshToken) {
    if (isBlank(refreshToken)) {
      return { status: 401, body: { message: INVALID_TOKEN_MESSAGE } };
    }

    const storedToken = await findRefreshToken(refreshToken);
    if (!storedToken || storedToken.revoked || new Date(storedToken.expires_at) <= new Date()) {
      return { status: 401, body: { message: INVALID_TOKEN_MESSAGE } };
    }

    try {
      const payload = authTokenService.verifyRefreshToken(refreshToken);
      const user = await findUserById(payload.user_id);
      if (!user) {
        return { status: 401, body: { message: INVALID_TOKEN_MESSAGE } };
      }

      const accessToken = authTokenService.createAccessToken(user);
      return { status: 200, body: { accessToken } };
    } catch (_error) {
      return { status: 401, body: { message: INVALID_TOKEN_MESSAGE } };
    }
  },

  async me(userId) {
    const user = await findUserById(userId);
    if (!user) {
      return { status: 404, body: { message: 'Tài khoản không tồn tại' } };
    }

    return { status: 200, body: { user } };
  },

  async logout(refreshToken) {
    if (isBlank(refreshToken)) {
      return { status: 400, body: { message: MISSING_INFO_MESSAGE } };
    }

    await revokeRefreshToken(refreshToken);
    return { status: 200, body: { message: 'Đăng xuất thành công' } };
  },
};

module.exports = { authService, authTokenService };
