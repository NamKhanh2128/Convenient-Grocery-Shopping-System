const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminShoppingController = require('../controllers/AdminShoppingController');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/meta/users', AdminShoppingController.getUsers);

router.get('/',                     AdminShoppingController.list);
router.get('/:id',                  AdminShoppingController.getById);
router.put('/:id',                  AdminShoppingController.update);
router.delete('/:id',               AdminShoppingController.remove);
router.post('/bulk-delete',         AdminShoppingController.bulkDelete);
router.put('/:id/items/:itemId',    AdminShoppingController.updateItem);
router.delete('/:id/items/:itemId', AdminShoppingController.removeItem);

module.exports = router;
