const express = require('express');
const { FamilyController } = require('../controllers/FamilyController');
const { FamilyModel } = require('../models/FamilyModel');
const { authTokenService } = require('../services/authService');
const { invitationLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();

function devEmailFromId(userId) {
  return `${String(userId || 'dev-user').trim().toLowerCase()}@dev.local`;
}

async function resolveRequestUser({ userId, email, fullName }) {
  return FamilyModel.resolveUserIdentity({
    id: userId,
    email,
    fullName,
  });
}

async function authenticateFamilyRequest(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, data: null, message: 'Thieu Bearer token.' });
  }

  try {
    let user;

    if (token.startsWith('mock-token-') && process.env.NODE_ENV !== 'production') {
      const rawId = token.replace('mock-token-', '') || 'dev-user';
      user = await resolveRequestUser({
        userId: rawId,
        email: devEmailFromId(rawId),
        fullName: rawId,
      });
    } else if (token.startsWith('mock-token-')) {
      return res.status(401).json({ success: false, data: null, message: 'Mock tokens are disabled in production.' });
    } else {
      const payload = authTokenService.verifyAccessToken(token);
      const userId = payload.user_id || payload.id || payload.sub;
      user = await resolveRequestUser({
        userId,
        email: payload.email,
        fullName: payload.full_name || payload.name,
      });
    }

    req.user = { id: user.user_id, user_id: user.user_id, email: user.email, role: user.role };
    return next();
  } catch (error) {
    console.error('[Family] error:', error);
    return res.status(401).json({ success: false, data: null, message: 'Token khong hop le.' });
  }
}

// ─── Public routes (no auth) ─────────────────────────────────────────────────
// Must be registered BEFORE the auth middleware to avoid 401 on public routes.
router.get('/invitations/token/:token', FamilyController.getInvitationByToken);

// ─── Authenticated routes ─────────────────────────────────────────────────────
router.use(authenticateFamilyRequest);

router.get('/me', FamilyController.getMe);
router.post('/', FamilyController.create);
router.post('/join', FamilyController.join);
router.patch('/me', FamilyController.updateMe);
router.get('/members', FamilyController.listMembers);
router.post('/members', FamilyController.addMember);
router.delete('/members/:id', FamilyController.removeMember);
router.delete('/leave', FamilyController.leave);
router.patch('/admin/transfer', FamilyController.transferAdmin);

// Specific token-based routes MUST come before /:id wildcard routes in Express
router.post('/invitations', invitationLimiter, FamilyController.inviteByEmail);
router.post('/invitations/token/:token/accept', FamilyController.acceptInvitationByToken);

// Parameterized invitation routes (by invitation ID)
router.get('/invitations/sent', FamilyController.listSentInvitations);
router.get('/invitations/received', FamilyController.listReceivedInvitations);
router.post('/invitations/:id/accept', FamilyController.acceptInvitation);
router.post('/invitations/:id/reject', FamilyController.rejectInvitation);
router.post('/invitations/:id/resend', invitationLimiter, FamilyController.resendInvitation);
router.delete('/invitations/:id', FamilyController.cancelInvitation);

module.exports = router;
