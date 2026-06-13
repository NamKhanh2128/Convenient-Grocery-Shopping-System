const express = require('express');
const { authRequired } = require('../middleware/auth');
const FridgeController = require('../controllers/FridgeController');

const router = express.Router();

// Shared auth middleware. Unlike the previous inline copy, `authRequired`
// resolves the caller's family_group_id from the database, so fridge items are
// scoped to the whole family (not just the individual user). It also rejects
// mock tokens in production.
router.use(authRequired);

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
