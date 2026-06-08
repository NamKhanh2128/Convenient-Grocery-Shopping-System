const express = require('express');
const jwt = require('jsonwebtoken');
const MealPlanController = require('../controllers/MealPlanController');

const router = express.Router();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
  }

  try {
    const token = authHeader.slice(7);

    // Token mock từ FE (auth mockDb) — dev only
    if (token.startsWith('mock-token-')) {
      req.user = {
        id: token.slice('mock-token-'.length),
        familyGroupId: null,
        name: null,
      };
      return next();
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = {
      id: payload.id || payload.userId || payload.sub,
      familyGroupId: payload.familyGroupId || null,
      name: payload.name || payload.fullName || null,
    };
    if (!req.user.id) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

router.use(authMiddleware);

router.post('/', MealPlanController.createPlan);
router.get('/', MealPlanController.getPlans);
router.get('/:planId', MealPlanController.getPlanDetail);
router.patch('/:planId/items/:itemId/cooked', MealPlanController.markItemCooked);
router.delete('/:planId', MealPlanController.deletePlan);

module.exports = router;
