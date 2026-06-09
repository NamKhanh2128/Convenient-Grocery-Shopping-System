const express = require('express');
const jwt = require('jsonwebtoken');
const FridgeController = require('../controllers/FridgeController');

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

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET_ACCESS || process.env.JWT_SECRET || 'dev-secret'
    );
    req.user = {
      id: payload.user_id || payload.id || payload.userId || payload.sub,
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

router.get('/storage-suggestion', FridgeController.getStorageSuggestion);
router.get('/items/expiring', FridgeController.getExpiring);
router.get('/items/export', FridgeController.exportCsv);
router.get('/items/available-ingredients', FridgeController.getAvailableIngredients);
router.get('/items', FridgeController.getItems);
router.post('/items', FridgeController.addItem);
router.put('/items/:id', FridgeController.updateItem);
router.patch('/items/:id/quantity', FridgeController.updateQuantity);
router.delete('/items/bulk', FridgeController.bulkDelete);
router.delete('/items/:id', FridgeController.deleteItem);

module.exports = router;
