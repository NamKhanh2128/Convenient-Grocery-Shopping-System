const express = require('express');
const { FamilyController } = require('../controllers/FamilyController');
const { FamilyModel } = require('../models/FamilyModel');
const { authTokenService } = require('../services/authService');

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

    if (token.startsWith('mock-token-')) {
      const rawId = token.replace('mock-token-', '') || 'dev-user';
      user = await resolveRequestUser({
        userId: rawId,
        email: devEmailFromId(rawId),
        fullName: rawId,
      });
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
router.get('/invitations/sent', FamilyController.listSentInvitations);
router.get('/invitations/received', FamilyController.listReceivedInvitations);
router.post('/invitations/:id/accept', FamilyController.acceptInvitation);
router.post('/invitations/:id/reject', FamilyController.rejectInvitation);

module.exports = router;
