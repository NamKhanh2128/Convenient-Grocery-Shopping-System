const express = require('express');
const ctrl = require('../controllers/ShoppingController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);

router.get('/', ctrl.getLists);
router.post('/', ctrl.createList);
router.get('/:listId', ctrl.getListDetail);
router.delete('/:listId', ctrl.deleteList);
router.post('/:listId/items', ctrl.addItem);
router.delete('/:listId/items', ctrl.deleteItems);
router.patch('/:listId/items/:itemId/purchased', ctrl.recordPurchase);
router.patch('/:listId/items/:itemId', ctrl.updateItem);
router.patch('/:listId/complete', ctrl.completeList);

module.exports = router;
