const crypto = require('crypto');
const { pool } = require('../config/db');
const { familySchema: schema } = require('../config/familySchema');

const f = schema.family;
const u = schema.user;
const m = schema.member;
const invitationTable = 'family_invitations';
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

let schemaReadyPromise;

function normalizeFamily(row) {
  if (!row) return null;
  return {
    family_id: String(row.family_id),
    family_name: row.family_name,
    family_code: row.family_code,
    created_by: row.created_by === null || row.created_by === undefined ? null : String(row.created_by),
    created_at: row.created_at,
    updated_at: row.updated_at,
    role: row.role,
  };
}

function normalizeUser(row) {
  if (!row) return null;
  return {
    user_id: String(row.user_id),
    full_name: row.full_name,
    email: row.email,
    role: row.role || 'member',
    joined_at: row.joined_at,
  };
}

function normalizeInvitation(row) {
  if (!row) return null;
  return {
    id: row.id,
    invitationId: row.id,
    groupId: row.group_id === null || row.group_id === undefined ? null : String(row.group_id),
    invitedUserId: row.invited_user_id === null || row.invited_user_id === undefined ? null : String(row.invited_user_id),
    inviterUserId: row.inviter_user_id === null || row.inviter_user_id === undefined ? null : String(row.inviter_user_id),
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at,
    expiresAt: row.expires_at === undefined ? null : row.expires_at,
    invitedEmail: row.invited_email === undefined ? null : row.invited_email,
    email: row.email,
    fullName: row.full_name,
    familyName: row.family_name,
    familyCode: row.family_code,
    inviterName: row.inviter_name,
  };
}

const familySelect = `
  ${f.id} AS family_id,
  ${f.name} AS family_name,
  ${f.code} AS family_code,
  ${f.createdBy} AS created_by,
  ${f.createdAt} AS created_at,
  ${f.updatedAt} AS updated_at
`;

const userSelect = `
  ${u.id} AS user_id,
  ${u.fullName} AS full_name,
  ${u.email} AS email,
  ${u.role} AS role
`;

async function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await pool.query(`ALTER TABLE ${f.table} ADD COLUMN IF NOT EXISTS ${f.code} VARCHAR(20) UNIQUE`);
      await pool.query(`ALTER TABLE ${m.table} ADD COLUMN IF NOT EXISTS ${m.role} VARCHAR(20) DEFAULT 'member'`);
      await pool.query(
        `CREATE TABLE IF NOT EXISTS ${invitationTable} (
          id SERIAL PRIMARY KEY,
          group_id INTEGER NOT NULL REFERENCES ${f.table}(${f.id}) ON DELETE CASCADE,
          inviter_user_id INTEGER NOT NULL REFERENCES ${u.table}(${u.id}) ON DELETE CASCADE,
          invited_user_id INTEGER NOT NULL REFERENCES ${u.table}(${u.id}) ON DELETE CASCADE,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT NOW(),
          responded_at TIMESTAMP,
          UNIQUE(group_id, invited_user_id, status)
        )`
      );
      await pool.query(
        `ALTER TABLE ${invitationTable} ALTER COLUMN invited_user_id DROP NOT NULL`
      );
      await pool.query(
        `ALTER TABLE ${invitationTable} ADD COLUMN IF NOT EXISTS invited_email VARCHAR(255)`
      );
      await pool.query(
        `ALTER TABLE ${invitationTable} ADD COLUMN IF NOT EXISTS token_hash VARCHAR(64) UNIQUE`
      );
      await pool.query(
        `ALTER TABLE ${invitationTable} ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`
      );
      await pool.query(
        `UPDATE ${invitationTable} fi
         SET invited_email = ${u.table}.${u.email}
         FROM ${u.table}
         WHERE fi.invited_email IS NULL AND fi.invited_user_id = ${u.table}.${u.id}`
      );
      await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS family_invitations_pending_email_idx
         ON ${invitationTable} (group_id, lower(invited_email))
         WHERE status = 'pending'`
      );
      await pool.query(
        `DELETE FROM ${m.table} a
         USING ${m.table} b
         WHERE a.${m.id} > b.${m.id}
           AND a.${m.familyId} = b.${m.familyId}
           AND a.${m.userId} = b.${m.userId}`
      );
      await pool.query(
        `ALTER TABLE ${m.table}
         ADD CONSTRAINT group_members_group_user_unique UNIQUE (${m.familyId}, ${m.userId})`
      ).catch((error) => {
        if (!['42710', '42P07'].includes(error.code)) throw error;
      });
      await pool.query(
        `UPDATE ${f.table}
         SET ${f.code} = 'FAM-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4))
         WHERE ${f.code} IS NULL`
      );
      await pool.query(
        `UPDATE ${m.table}
         SET ${m.role} = 'admin'
         FROM ${f.table}
         WHERE ${m.table}.${m.familyId} = ${f.table}.${f.id}
           AND ${m.table}.${m.userId} = ${f.table}.${f.createdBy}
           AND COALESCE(${m.table}.${m.role}, 'member') <> 'admin'`
      );
    })();
  }

  return schemaReadyPromise;
}

async function expirePendingInvitations() {
  await pool.query(
    `UPDATE ${invitationTable}
     SET status = 'expired'
     WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < NOW()`
  );
}

const FamilyModel = {
  async ensureSchema() {
    await ensureSchema();
  },

  async findUserById(userId) {
    await ensureSchema();
    const { rows } = await pool.query(
      `SELECT ${userSelect}
       FROM ${u.table}
       WHERE ${u.id}::text = $1
       LIMIT 1`,
      [String(userId)]
    );

    return normalizeUser(rows[0]);
  },

  async findUserByEmail(email) {
    await ensureSchema();
    const { rows } = await pool.query(
      `SELECT ${userSelect}
       FROM ${u.table}
       WHERE lower(${u.email}) = lower($1)
       LIMIT 1`,
      [String(email)]
    );

    return normalizeUser(rows[0]);
  },

  async createDevUser({ fullName, email }) {
    await ensureSchema();
    const { rows } = await pool.query(
      `INSERT INTO ${u.table} (${u.email}, ${u.password}, ${u.fullName}, ${u.role})
       VALUES ($1, $2, $3, 'user')
       ON CONFLICT (${u.email}) DO UPDATE
       SET ${u.fullName} = COALESCE(${u.table}.${u.fullName}, EXCLUDED.${u.fullName})
       RETURNING ${userSelect}`,
      [email, 'dev-password-not-used', fullName]
    );

    return normalizeUser(rows[0]);
  },

  async resolveUserIdentity({ id, email, fullName }) {
    await ensureSchema();

    if (id) {
      const byId = await this.findUserById(id);
      if (byId) return byId;
    }

    if (email) {
      const byEmail = await this.findUserByEmail(email);
      if (byEmail) return byEmail;
    }

    const fallbackEmail = email || `${String(id || 'dev-user').toLowerCase()}@dev.local`;
    const fallbackName = fullName || String(id || fallbackEmail).split('@')[0] || 'Dev User';
    return this.createDevUser({ fullName: fallbackName, email: fallbackEmail });
  },

  async findFamilyById(familyId) {
    await ensureSchema();
    const { rows } = await pool.query(
      `SELECT ${familySelect}
       FROM ${f.table}
       WHERE ${f.id}::text = $1
       LIMIT 1`,
      [String(familyId)]
    );

    return normalizeFamily(rows[0]);
  },

  async findFamilyByCode(code) {
    await ensureSchema();
    const { rows } = await pool.query(
      `SELECT ${familySelect}
       FROM ${f.table}
       WHERE upper(${f.code}) = upper($1)
       LIMIT 1`,
      [String(code)]
    );

    return normalizeFamily(rows[0]);
  },

  async findFamilyForUser(userId) {
    await ensureSchema();
    const user = await this.findUserById(userId);
    if (!user) return { user: null, family: null };

    const { rows } = await pool.query(
      `SELECT
        ${f.table}.${f.id} AS family_id,
        ${f.table}.${f.name} AS family_name,
        ${f.table}.${f.code} AS family_code,
        ${f.table}.${f.createdBy} AS created_by,
        ${f.table}.${f.createdAt} AS created_at,
        ${f.table}.${f.updatedAt} AS updated_at,
        ${m.table}.${m.role} AS role
       FROM ${f.table}
       JOIN ${m.table} ON ${m.table}.${m.familyId} = ${f.table}.${f.id}
       WHERE ${m.table}.${m.userId}::text = $1
       ORDER BY ${m.table}.${m.joinedAt} DESC
       LIMIT 1`,
      [String(userId)]
    );

    return { user, family: normalizeFamily(rows[0]) };
  },

  async renameFamily(familyId, familyName) {
    await ensureSchema();
    const { rows } = await pool.query(
      `UPDATE ${f.table}
       SET ${f.name} = $2, ${f.updatedAt} = NOW()
       WHERE ${f.id}::text = $1
       RETURNING ${familySelect}`,
      [String(familyId), familyName]
    );

    return normalizeFamily(rows[0]);
  },

  async setFamilyCode(familyId, familyCode) {
    await ensureSchema();
    const { rows } = await pool.query(
      `UPDATE ${f.table}
       SET ${f.code} = $2
       WHERE ${f.id}::text = $1
       RETURNING ${familySelect}`,
      [String(familyId), familyCode]
    );

    return normalizeFamily(rows[0]);
  },

  async createFamilyForUser(userId, familyName, familyCode) {
    await ensureSchema();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      console.log('[Family] create family payload:', { userId, familyName, familyCode });

      const result = await client.query(
        `INSERT INTO ${f.table} (${f.name}, ${f.createdBy}, ${f.code})
         VALUES ($1, $2, $3)
         RETURNING ${familySelect}`,
        [familyName, userId, familyCode]
      );
      console.log('[Family] SQL result:', result.rows);

      await client.query(
        `DELETE FROM ${m.table}
         WHERE ${m.userId}::text = $1`,
        [String(userId)]
      );

      await client.query(
        `INSERT INTO ${m.table} (${m.familyId}, ${m.userId}, ${m.role})
         VALUES ($1, $2, 'admin')
         ON CONFLICT (${m.familyId}, ${m.userId}) DO NOTHING`,
        [result.rows[0].family_id, userId]
      );

      await client.query('COMMIT');
      return normalizeFamily(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Family] error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async listMembers(familyId) {
    await ensureSchema();
    const { rows } = await pool.query(
      `SELECT
        ${u.table}.${u.id} AS user_id,
        ${u.table}.${u.fullName} AS full_name,
        ${u.table}.${u.email} AS email,
        ${m.table}.${m.role} AS role,
        ${m.table}.${m.joinedAt} AS joined_at
       FROM ${m.table}
       JOIN ${u.table} ON ${u.table}.${u.id} = ${m.table}.${m.userId}
       WHERE ${m.table}.${m.familyId}::text = $1
       ORDER BY
        CASE WHEN ${m.table}.${m.role} = 'admin' THEN 0 ELSE 1 END,
        ${m.table}.${m.joinedAt} ASC`,
      [String(familyId)]
    );

    return rows.map(normalizeUser);
  },

  async isMember(userId, familyId) {
    await ensureSchema();
    const { rows } = await pool.query(
      `SELECT 1
       FROM ${m.table}
       WHERE ${m.userId}::text = $1 AND ${m.familyId}::text = $2
       LIMIT 1`,
      [String(userId), String(familyId)]
    );

    return Boolean(rows[0]);
  },

  async findMember(userId, familyId) {
    await ensureSchema();
    const { rows } = await pool.query(
      `SELECT
        ${m.table}.${m.id} AS member_id,
        ${m.table}.${m.familyId} AS family_id,
        ${m.table}.${m.userId} AS user_id,
        ${m.table}.${m.role} AS role,
        ${m.table}.${m.joinedAt} AS joined_at
       FROM ${m.table}
       WHERE ${m.table}.${m.userId}::text = $1 AND ${m.table}.${m.familyId}::text = $2
       LIMIT 1`,
      [String(userId), String(familyId)]
    );

    return rows[0] || null;
  },

  async countMembers(familyId) {
    await ensureSchema();
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM ${m.table}
       WHERE ${m.familyId}::text = $1`,
      [String(familyId)]
    );

    return rows[0]?.count || 0;
  },

  async createInvitation({ familyId, inviterUserId, invitedUserId }) {
    await ensureSchema();
    const { rows } = await pool.query(
      `INSERT INTO ${invitationTable} (group_id, inviter_user_id, invited_user_id, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (group_id, invited_user_id, status) DO UPDATE
       SET inviter_user_id = EXCLUDED.inviter_user_id,
           created_at = NOW(),
           responded_at = NULL
       RETURNING id, group_id, inviter_user_id, invited_user_id, status, created_at, responded_at`,
      [familyId, inviterUserId, invitedUserId]
    );

    return normalizeInvitation(rows[0]);
  },

  async listSentInvitations(familyId) {
    await ensureSchema();
    await expirePendingInvitations();
    const { rows } = await pool.query(
      `SELECT
        fi.id,
        fi.group_id,
        fi.inviter_user_id,
        fi.invited_user_id,
        fi.invited_email,
        fi.status,
        fi.created_at,
        fi.responded_at,
        fi.expires_at,
        COALESCE(${u.table}.${u.email}, fi.invited_email) AS email,
        ${u.table}.${u.fullName} AS full_name
       FROM ${invitationTable} fi
       LEFT JOIN ${u.table} ON ${u.table}.${u.id} = fi.invited_user_id
       WHERE fi.group_id::text = $1
       ORDER BY
        CASE WHEN fi.status = 'pending' THEN 0 ELSE 1 END,
        fi.created_at DESC`,
      [String(familyId)]
    );

    return rows.map(normalizeInvitation);
  },

  async listReceivedInvitations(userId, userEmail) {
    await ensureSchema();
    await expirePendingInvitations();

    if (userEmail) {
      await pool.query(
        `UPDATE ${invitationTable}
         SET invited_user_id = $1
         WHERE invited_user_id IS NULL
           AND lower(invited_email) = lower($2)
           AND status = 'pending'`,
        [userId, String(userEmail)]
      );
    }

    const inviter = 'inviter';
    const { rows } = await pool.query(
      `SELECT
        fi.id,
        fi.group_id,
        fi.inviter_user_id,
        fi.invited_user_id,
        fi.invited_email,
        fi.status,
        fi.created_at,
        fi.responded_at,
        fi.expires_at,
        ${f.table}.${f.name} AS family_name,
        ${f.table}.${f.code} AS family_code,
        ${inviter}.${u.fullName} AS inviter_name
       FROM ${invitationTable} fi
       JOIN ${f.table} ON ${f.table}.${f.id} = fi.group_id
       JOIN ${u.table} ${inviter} ON ${inviter}.${u.id} = fi.inviter_user_id
       WHERE fi.invited_user_id::text = $1 AND fi.status = 'pending'
       ORDER BY fi.created_at DESC`,
      [String(userId)]
    );

    return rows.map(normalizeInvitation);
  },

  async acceptInvitation(invitationId, userId) {
    await ensureSchema();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const invitationResult = await client.query(
        `SELECT id, group_id, inviter_user_id, invited_user_id, status, created_at, responded_at
         FROM ${invitationTable}
         WHERE id::text = $1 AND invited_user_id::text = $2
         LIMIT 1`,
        [String(invitationId), String(userId)]
      );
      const invitation = invitationResult.rows[0];
      if (!invitation) {
        await client.query('ROLLBACK');
        return { status: 'not_found', family: null };
      }
      if (invitation.status !== 'pending') {
        await client.query('ROLLBACK');
        return { status: 'not_pending', family: null };
      }

      await client.query(
        `INSERT INTO ${m.table} (${m.familyId}, ${m.userId}, ${m.role})
         VALUES ($1, $2, 'member')
         ON CONFLICT (${m.familyId}, ${m.userId}) DO NOTHING`,
        [invitation.group_id, userId]
      );
      await client.query(
        `UPDATE ${invitationTable}
         SET status = 'accepted', responded_at = NOW()
         WHERE id = $1`,
        [invitation.id]
      );
      const familyResult = await client.query(
        `SELECT ${familySelect}
         FROM ${f.table}
         WHERE ${f.id} = $1
         LIMIT 1`,
        [invitation.group_id]
      );

      await client.query('COMMIT');
      return { status: 'accepted', family: normalizeFamily(familyResult.rows[0]) };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Family] error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async rejectInvitation(invitationId, userId) {
    await ensureSchema();
    const { rows } = await pool.query(
      `UPDATE ${invitationTable}
       SET status = 'rejected', responded_at = NOW()
       WHERE id::text = $1 AND invited_user_id::text = $2 AND status = 'pending'
       RETURNING id, group_id, inviter_user_id, invited_user_id, status, created_at, responded_at`,
      [String(invitationId), String(userId)]
    );

    return normalizeInvitation(rows[0]);
  },

  async createEmailInvitation({ familyId, inviterUserId, email }) {
    await ensureSchema();
    await expirePendingInvitations();
    const normalizedEmail = String(email).trim().toLowerCase();

    const targetUser = await this.findUserByEmail(normalizedEmail);
    if (targetUser) {
      const isMember = await this.isMember(targetUser.user_id, familyId);
      if (isMember) return { status: 'already_member', invitation: null };
    }

    const { rows: existingRows } = await pool.query(
      `SELECT id, group_id, inviter_user_id, invited_user_id, invited_email, status, created_at, responded_at, expires_at
       FROM ${invitationTable}
       WHERE group_id::text = $1 AND status = 'pending'
         AND (lower(invited_email) = $2 OR invited_user_id::text = $3)
       LIMIT 1`,
      [String(familyId), normalizedEmail, targetUser ? String(targetUser.user_id) : '']
    );
    if (existingRows[0]) {
      return { status: 'already_invited', invitation: normalizeInvitation(existingRows[0]) };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    const { rows } = await pool.query(
      `INSERT INTO ${invitationTable} (group_id, inviter_user_id, invited_user_id, invited_email, token_hash, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, group_id, inviter_user_id, invited_user_id, invited_email, status, created_at, responded_at, expires_at`,
      [familyId, inviterUserId, targetUser ? targetUser.user_id : null, normalizedEmail, tokenHash, expiresAt]
    );

    return { status: 'created', invitation: normalizeInvitation(rows[0]), rawToken };
  },

  async findInvitationByToken(rawToken) {
    await ensureSchema();
    await expirePendingInvitations();
    const tokenHash = hashToken(String(rawToken));
    const inviter = 'inviter';

    const { rows } = await pool.query(
      `SELECT
        fi.id,
        fi.group_id,
        fi.inviter_user_id,
        fi.invited_user_id,
        fi.invited_email,
        fi.status,
        fi.created_at,
        fi.responded_at,
        fi.expires_at,
        ${f.table}.${f.name} AS family_name,
        ${f.table}.${f.code} AS family_code,
        ${inviter}.${u.fullName} AS inviter_name
       FROM ${invitationTable} fi
       JOIN ${f.table} ON ${f.table}.${f.id} = fi.group_id
       JOIN ${u.table} ${inviter} ON ${inviter}.${u.id} = fi.inviter_user_id
       WHERE fi.token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    return normalizeInvitation(rows[0]);
  },

  async acceptInvitationByToken(rawToken, userId, userEmail) {
    await ensureSchema();
    await expirePendingInvitations();
    const tokenHash = hashToken(String(rawToken));
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT id, group_id, inviter_user_id, invited_user_id, invited_email, status, expires_at
         FROM ${invitationTable}
         WHERE token_hash = $1
         FOR UPDATE`,
        [tokenHash]
      );
      const invitation = rows[0];
      if (!invitation) {
        await client.query('ROLLBACK');
        return { status: 'not_found', family: null };
      }
      if (invitation.status !== 'pending') {
        await client.query('ROLLBACK');
        return { status: invitation.status === 'expired' ? 'expired' : 'not_pending', family: null };
      }
      if (String(invitation.invited_email || '').toLowerCase() !== String(userEmail || '').toLowerCase()) {
        await client.query('ROLLBACK');
        return { status: 'email_mismatch', family: null };
      }

      if (!invitation.invited_user_id) {
        await client.query(
          `UPDATE ${invitationTable} SET invited_user_id = $1 WHERE id = $2`,
          [userId, invitation.id]
        );
      }

      await client.query(
        `DELETE FROM ${m.table}
         WHERE ${m.userId}::text = $1`,
        [String(userId)]
      );
      await client.query(
        `INSERT INTO ${m.table} (${m.familyId}, ${m.userId}, ${m.role})
         VALUES ($1, $2, 'member')
         ON CONFLICT (${m.familyId}, ${m.userId}) DO NOTHING`,
        [invitation.group_id, userId]
      );
      await client.query(
        `UPDATE ${invitationTable}
         SET status = 'accepted', responded_at = NOW()
         WHERE id = $1`,
        [invitation.id]
      );
      const familyResult = await client.query(
        `SELECT ${familySelect}
         FROM ${f.table}
         WHERE ${f.id} = $1
         LIMIT 1`,
        [invitation.group_id]
      );

      await client.query('COMMIT');
      return { status: 'accepted', family: normalizeFamily(familyResult.rows[0]) };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Family] error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async resendInvitation(invitationId, familyId) {
    await ensureSchema();
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    const { rows } = await pool.query(
      `UPDATE ${invitationTable}
       SET token_hash = $3, expires_at = $4, status = 'pending', responded_at = NULL
       WHERE id::text = $1 AND group_id::text = $2 AND status IN ('pending', 'expired')
       RETURNING id, group_id, inviter_user_id, invited_user_id, invited_email, status, created_at, responded_at, expires_at`,
      [String(invitationId), String(familyId), tokenHash, expiresAt]
    );

    if (!rows[0]) return null;
    return { invitation: normalizeInvitation(rows[0]), rawToken };
  },

  async cancelInvitation(invitationId, familyId) {
    await ensureSchema();
    const { rows } = await pool.query(
      `UPDATE ${invitationTable}
       SET status = 'cancelled', responded_at = NOW()
       WHERE id::text = $1 AND group_id::text = $2 AND status IN ('pending', 'expired')
       RETURNING id, group_id, inviter_user_id, invited_user_id, invited_email, status, created_at, responded_at, expires_at`,
      [String(invitationId), String(familyId)]
    );

    return normalizeInvitation(rows[0]);
  },

  async attachMemberToFamily(userId, familyId) {
    await ensureSchema();
    const { rows } = await pool.query(
      `INSERT INTO ${m.table} (${m.familyId}, ${m.userId}, ${m.role})
       VALUES ($1, $2, 'member')
       ON CONFLICT (${m.familyId}, ${m.userId}) DO NOTHING
       RETURNING ${m.id} AS member_id, ${m.familyId} AS family_id, ${m.userId} AS user_id, ${m.role} AS role, ${m.joinedAt} AS joined_at`,
      [familyId, userId]
    );

    return rows[0] || null;
  },

  async switchUserToFamily(userId, familyId) {
    await ensureSchema();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(
        `DELETE FROM ${m.table}
         WHERE ${m.userId}::text = $1`,
        [String(userId)]
      );
      const { rows } = await client.query(
        `INSERT INTO ${m.table} (${m.familyId}, ${m.userId}, ${m.role})
         VALUES ($1, $2, 'member')
         ON CONFLICT (${m.familyId}, ${m.userId}) DO NOTHING
         RETURNING ${m.id} AS member_id, ${m.familyId} AS family_id, ${m.userId} AS user_id, ${m.role} AS role, ${m.joinedAt} AS joined_at`,
        [familyId, userId]
      );
      await client.query('COMMIT');
      return rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Family] error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async leaveFamily(userId, familyId) {
    await ensureSchema();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `DELETE FROM ${m.table}
         WHERE ${m.userId}::text = $1 AND ${m.familyId}::text = $2
         RETURNING ${m.id} AS member_id, ${m.familyId} AS family_id, ${m.userId} AS user_id`,
        [String(userId), String(familyId)]
      );

      await client.query(
        `DELETE FROM ${f.table}
         WHERE ${f.id}::text = $1
           AND NOT EXISTS (
             SELECT 1 FROM ${m.table} WHERE ${m.familyId}::text = $1
           )`,
        [String(familyId)]
      );

      await client.query('COMMIT');
      return rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Family] leave error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async transferAdminRole(familyId, currentUserId, targetUserId) {
    await ensureSchema();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE ${m.table}
         SET ${m.role} = 'member'
         WHERE ${m.familyId}::text = $1 AND ${m.userId}::text = $2`,
        [String(familyId), String(currentUserId)]
      );
      const { rows } = await client.query(
        `UPDATE ${m.table}
         SET ${m.role} = 'admin'
         WHERE ${m.familyId}::text = $1 AND ${m.userId}::text = $2
         RETURNING ${m.id} AS member_id, ${m.familyId} AS family_id, ${m.userId} AS user_id, ${m.role} AS role`,
        [String(familyId), String(targetUserId)]
      );
      await client.query('COMMIT');
      return rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Family] error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async detachMemberFromFamily(userId, familyId) {
    await ensureSchema();
    const result = await pool.query(
      `DELETE FROM ${m.table}
       WHERE ${m.userId}::text = $1 AND ${m.familyId}::text = $2
       RETURNING ${m.id} AS member_id, ${m.familyId} AS family_id, ${m.userId} AS user_id`,
      [String(userId), String(familyId)]
    );

    return { rowCount: result.rowCount, member: result.rows[0] || null };
  },
};

module.exports = { FamilyModel };
