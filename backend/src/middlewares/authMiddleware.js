const { FamilyModel } = require('../models/FamilyModel');
const { authTokenService } = require('../services/authService');

const INVALID_TOKEN_MESSAGE = 'Token khong hop le hoac da het han';

function devEmailFromId(userId) {
  return `${String(userId || 'dev-user').trim().toLowerCase()}@dev.local`;
}

async function resolveRequestUser({ userId, email, fullName }) {
  return FamilyModel.resolveUserIdentity({ id: userId, email, fullName });
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: INVALID_TOKEN_MESSAGE });
  }

  try {
    let user;

    if (token.startsWith('mock-token-')) {
      const rawId = token.replace('mock-token-', '') || 'dev-user';
      user = await resolveRequestUser({
        userId: rawId,
        email: devEmailFromId(rawId),
        fullName: rawId,
      });
    } else {
      const payload = authTokenService.verifyAccessToken(token);
      const userId = payload.user_id || payload.nguoi_dung_id || payload.id || payload.sub;
      user = await resolveRequestUser({
        userId,
        email: payload.email,
        fullName: payload.full_name || payload.name,
      });
    }

    req.user = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };
    return next();
  } catch (error) {
    console.error('[Family] error:', error);
    return res.status(401).json({ message: INVALID_TOKEN_MESSAGE });
  }
}

module.exports = { authMiddleware };
