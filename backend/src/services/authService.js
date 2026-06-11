const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authSchema } = require('../config/authSchema');
const { pool } = require('../config/db');
const { emailService } = require('./emailService');
const { oauthService } = require('./oauthService');

const MISSING_INFO_MESSAGE = 'Vui lòng nhập đầy đủ thông tin';
const INVALID_TOKEN_MESSAGE = 'Token không hợp lệ hoặc đã hết hạn';
const DEFAULT_ACCESS_EXPIRES_IN = '15m';
const DEFAULT_REFRESH_EXPIRES_IN = '7d';
const MAX_FAILED_LOGIN_ATTEMPTS = Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS || 5);
const PASSWORD_RESET_TOKEN_TTL_MS = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 60) * 60 * 1000;
const FRONTEND_USER_URL = process.env.FRONTEND_USER_URL || 'https://convenient-grocery-shopping-system.vercel.app';
const u = authSchema.user;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

let passwordResetSchemaReadyPromise;

function ensurePasswordResetSchema() {
  if (!passwordResetSchemaReadyPromise) {
    passwordResetSchemaReadyPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES ${u.table}(${u.id}) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);
    `);
  }

  return passwordResetSchemaReadyPromise;
}

let oauthSchemaReadyPromise;

function ensureOAuthSchema() {
  if (!oauthSchemaReadyPromise) {
    oauthSchemaReadyPromise = pool.query(`
      ALTER TABLE ${u.table} ADD COLUMN IF NOT EXISTS google_id VARCHAR UNIQUE;
      ALTER TABLE ${u.table} ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;
      ALTER TABLE ${u.table} ADD COLUMN IF NOT EXISTS auth_provider VARCHAR NOT NULL DEFAULT 'local';
      ALTER TABLE ${u.table} ALTER COLUMN ${u.password} DROP NOT NULL;
    `);
  }

  return oauthSchemaReadyPromise;
}

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
    phone: row.phone ?? null,
    avatar_url: row.avatar_url ?? null,
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
      ${u.role} AS role,
      phone,
      avatar_url,
      is_locked,
      failed_login_attempts
     FROM ${u.table}
     WHERE lower(${u.email}) = lower($1)
     LIMIT 1`,
    [email]
  );

  const user = normalizeUser(rows[0]);
  return user
    ? {
        ...user,
        password: rows[0].password,
        is_locked: Boolean(rows[0].is_locked),
        failed_login_attempts: rows[0].failed_login_attempts || 0,
      }
    : null;
}

async function registerFailedLogin(userId, currentAttempts) {
  const attempts = (currentAttempts || 0) + 1;
  const shouldLock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;

  await pool.query(
    `UPDATE ${u.table}
     SET failed_login_attempts = $2, is_locked = is_locked OR $3
     WHERE ${u.id} = $1`,
    [userId, attempts, shouldLock]
  );

  return { attempts, locked: shouldLock };
}

async function registerSuccessfulLogin(userId) {
  await pool.query(
    `UPDATE ${u.table}
     SET failed_login_attempts = 0, last_login = NOW()
     WHERE ${u.id} = $1`,
    [userId]
  );
}

async function findUserById(userId) {
  const { rows } = await pool.query(
    `SELECT
      ${u.id} AS user_id,
      ${u.fullName} AS full_name,
      ${u.email} AS email,
      ${u.role} AS role,
      phone,
      avatar_url
     FROM ${u.table}
     WHERE ${u.id}::text = $1
     LIMIT 1`,
    [String(userId)]
  );

  return normalizeUser(rows[0]);
}

async function findUserByGoogleId(googleId) {
  const { rows } = await pool.query(
    `SELECT
      ${u.id} AS user_id,
      ${u.fullName} AS full_name,
      ${u.email} AS email,
      ${u.role} AS role,
      phone,
      avatar_url
     FROM ${u.table}
     WHERE google_id = $1
     LIMIT 1`,
    [googleId]
  );

  return normalizeUser(rows[0]);
}

async function linkGoogleAccount(userId, { googleId, avatarUrl }) {
  const { rows } = await pool.query(
    `UPDATE ${u.table}
     SET google_id = $2, avatar_url = COALESCE(avatar_url, $3), updated_at = NOW()
     WHERE ${u.id} = $1
     RETURNING
      ${u.id} AS user_id,
      ${u.fullName} AS full_name,
      ${u.email} AS email,
      ${u.role} AS role,
      phone,
      avatar_url`,
    [userId, googleId, avatarUrl]
  );

  return normalizeUser(rows[0]);
}

async function createGoogleUser({ fullName, email, googleId, avatarUrl }) {
  const { rows } = await pool.query(
    `INSERT INTO ${u.table} (${u.fullName}, ${u.email}, ${u.role}, google_id, avatar_url, auth_provider, ${u.password})
     VALUES ($1, $2, 'user', $3, $4, 'google', NULL)
     RETURNING
      ${u.id} AS user_id,
      ${u.fullName} AS full_name,
      ${u.email} AS email,
      ${u.role} AS role,
      phone,
      avatar_url`,
    [fullName, email, googleId, avatarUrl]
  );

  return normalizeUser(rows[0]);
}

async function findUserByIdWithPassword(userId) {
  const { rows } = await pool.query(
    `SELECT ${u.id} AS user_id, ${u.password} AS password
     FROM ${u.table}
     WHERE ${u.id}::text = $1
     LIMIT 1`,
    [String(userId)]
  );

  return rows[0] || null;
}

async function updateUserPassword(userId, passwordHash) {
  await pool.query(
    `UPDATE ${u.table}
     SET ${u.password} = $2, failed_login_attempts = 0, is_locked = false
     WHERE ${u.id} = $1`,
    [userId, passwordHash]
  );
}

async function revokeAllRefreshTokensForUser(userId) {
  await pool.query(
    `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false`,
    [userId]
  );
}

async function createPasswordResetToken(userId) {
  await ensurePasswordResetSchema();

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return rawToken;
}

async function findValidPasswordResetToken(rawToken) {
  await ensurePasswordResetSchema();

  const tokenHash = hashToken(String(rawToken));
  const { rows } = await pool.query(
    `SELECT id, user_id, expires_at, used_at
     FROM password_reset_tokens
     WHERE token_hash = $1
     LIMIT 1`,
    [tokenHash]
  );

  const record = rows[0];
  if (!record || record.used_at || new Date(record.expires_at) <= new Date()) {
    return null;
  }

  return record;
}

async function markPasswordResetTokenUsed(tokenId) {
  await pool.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [tokenId]);
}

async function updateUserProfile(userId, fields) {
  const updates = [];
  const values = [];
  let index = 1;

  if (fields.full_name !== undefined) {
    updates.push(`${u.fullName} = $${index++}`);
    values.push(fields.full_name);
  }

  if (fields.email !== undefined) {
    updates.push(`${u.email} = $${index++}`);
    values.push(fields.email);
  }

  if (fields.phone !== undefined) {
    updates.push(`phone = $${index++}`);
    values.push(fields.phone);
  }

  if (fields.avatar_url !== undefined) {
    updates.push(`avatar_url = $${index++}`);
    values.push(fields.avatar_url);
  }

  if (!updates.length) {
    return findUserById(userId);
  }

  values.push(String(userId));
  await pool.query(
    `UPDATE ${u.table} SET ${updates.join(', ')}, updated_at = NOW() WHERE ${u.id}::text = $${index}`,
    values
  );

  return findUserById(userId);
}

async function createUser({ fullName, email, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO ${u.table} (${u.fullName}, ${u.email}, ${u.password}, ${u.role})
     VALUES ($1, $2, $3, 'user')
     RETURNING
      ${u.id} AS user_id,
      ${u.fullName} AS full_name,
      ${u.email} AS email,
      ${u.role} AS role,
      phone`,
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

    await ensureOAuthSchema();

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

    await ensureOAuthSchema();

    const user = await findUserByEmail(String(email).trim().toLowerCase());
    if (!user) {
      return { status: 404, body: { message: 'Tài khoản không tồn tại' } };
    }

    if (user.is_locked) {
      return {
        status: 403,
        body: { message: 'Tài khoản đã bị khóa. Vui lòng đặt lại mật khẩu hoặc liên hệ quản trị viên.' },
      };
    }

    if (!user.password) {
      return {
        status: 401,
        body: { message: 'Tài khoản này chỉ đăng nhập được bằng Google. Vui lòng dùng "Đăng nhập bằng Google" hoặc đặt lại mật khẩu.' },
      };
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      const { locked } = await registerFailedLogin(user.user_id, user.failed_login_attempts);
      if (locked) {
        return {
          status: 403,
          body: { message: 'Tài khoản đã bị khóa do nhập sai mật khẩu quá nhiều lần.' },
        };
      }
      return { status: 401, body: { message: 'Mật khẩu không đúng' } };
    }

    await registerSuccessfulLogin(user.user_id);

    const { password: _password, is_locked: _isLocked, failed_login_attempts: _failedAttempts, ...safeUser } = user;
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

  async loginWithGoogle({ supabaseAccessToken }) {
    if (isBlank(supabaseAccessToken)) {
      return { status: 400, body: { message: MISSING_INFO_MESSAGE } };
    }

    let supabaseUser;
    try {
      supabaseUser = await oauthService.verifyGoogleAccessToken(supabaseAccessToken);
    } catch (error) {
      return { status: 401, body: { message: error.message } };
    }

    const googleId = supabaseUser.id;
    const email = String(supabaseUser.email || '').trim().toLowerCase();
    if (!googleId || !email) {
      return { status: 400, body: { message: 'Không lấy được thông tin tài khoản Google' } };
    }

    const emailConfirmed = Boolean(supabaseUser.email_confirmed_at || supabaseUser.confirmed_at);
    const metadata = supabaseUser.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || email.split('@')[0];
    const avatarUrl = metadata.avatar_url || metadata.picture || null;

    await ensureOAuthSchema();

    let user = await findUserByGoogleId(googleId);

    if (!user) {
      const existing = await findUserByEmail(email);
      if (existing) {
        if (!emailConfirmed) {
          return { status: 409, body: { message: 'Email Google chưa được xác thực, không thể liên kết tài khoản.' } };
        }
        if (existing.is_locked) {
          return { status: 403, body: { message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.' } };
        }
        user = await linkGoogleAccount(existing.user_id, { googleId, avatarUrl });
      } else {
        user = await createGoogleUser({ fullName, email, googleId, avatarUrl });
      }
    }

    await registerSuccessfulLogin(user.user_id);

    const accessToken = authTokenService.createAccessToken(user);
    const refreshToken = authTokenService.createRefreshToken(user);
    const expiresAt = authTokenService.getRefreshTokenExpiresAt(refreshToken);

    await createRefreshToken({
      userId: user.user_id,
      token: refreshToken,
      expiresAt,
    });

    return {
      status: 200,
      body: {
        message: 'Đăng nhập Google thành công',
        accessToken,
        refreshToken,
        user,
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

  async forgotPassword({ email }) {
    if (isBlank(email)) {
      return { status: 400, body: { message: MISSING_INFO_MESSAGE } };
    }

    const genericResponse = {
      status: 200,
      body: { message: 'Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi.' },
    };

    const user = await findUserByEmail(String(email).trim().toLowerCase());
    if (!user) {
      return genericResponse;
    }

    const rawToken = await createPasswordResetToken(user.user_id);
    const resetUrl = `${FRONTEND_USER_URL}/reset-password?token=${rawToken}`;
    await emailService.sendPasswordResetEmail(user.email, resetUrl);

    return genericResponse;
  },

  async resetPassword({ token, newPassword }) {
    if (isBlank(token) || isBlank(newPassword)) {
      return { status: 400, body: { message: MISSING_INFO_MESSAGE } };
    }

    const record = await findValidPasswordResetToken(token);
    if (!record) {
      return { status: 400, body: { message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' } };
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await updateUserPassword(record.user_id, passwordHash);
    await markPasswordResetTokenUsed(record.id);
    await revokeAllRefreshTokensForUser(record.user_id);

    return { status: 200, body: { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' } };
  },

  async changePassword({ userId, oldPassword, newPassword }) {
    if (isBlank(oldPassword) || isBlank(newPassword)) {
      return { status: 400, body: { message: MISSING_INFO_MESSAGE } };
    }

    const record = await findUserByIdWithPassword(userId);
    if (!record) {
      return { status: 404, body: { message: 'Tài khoản không tồn tại' } };
    }

    if (!record.password) {
      return {
        status: 400,
        body: { message: 'Tài khoản này chưa có mật khẩu. Vui lòng dùng chức năng quên mật khẩu để thiết lập mật khẩu mới.' },
      };
    }

    const isPasswordValid = await bcrypt.compare(String(oldPassword), record.password);
    if (!isPasswordValid) {
      return { status: 401, body: { message: 'Mật khẩu hiện tại không đúng' } };
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await updateUserPassword(userId, passwordHash);

    return { status: 200, body: { message: 'Đổi mật khẩu thành công' } };
  },

  async updateProfile(userId, { full_name, email, phone, avatar_url } = {}) {
    const fields = {};

    if (full_name !== undefined) {
      if (isBlank(full_name)) {
        return { status: 400, body: { message: MISSING_INFO_MESSAGE } };
      }
      fields.full_name = String(full_name).trim();
    }

    if (phone !== undefined) {
      fields.phone = phone === null || phone === '' ? null : String(phone).trim();
    }

    if (avatar_url !== undefined) {
      fields.avatar_url = avatar_url === null || avatar_url === '' ? null : String(avatar_url).trim();
    }

    if (email !== undefined) {
      if (isBlank(email)) {
        return { status: 400, body: { message: MISSING_INFO_MESSAGE } };
      }
      const normalizedEmail = String(email).trim().toLowerCase();
      const existing = await findUserByEmail(normalizedEmail);
      if (existing && String(existing.user_id) !== String(userId)) {
        return { status: 409, body: { message: 'Email đã được sử dụng bởi tài khoản khác' } };
      }
      fields.email = normalizedEmail;
    }

    const user = await updateUserProfile(userId, fields);
    if (!user) {
      return { status: 404, body: { message: 'Tài khoản không tồn tại' } };
    }

    return { status: 200, body: { message: 'Cập nhật hồ sơ thành công', user } };
  },
};

module.exports = { authService, authTokenService };
