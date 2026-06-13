const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminFoodCategoryController = require('../controllers/AdminFoodCategoryController');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/', AdminFoodCategoryController.list);
router.post('/bulk-delete', AdminFoodCategoryController.bulkDelete);
router.get('/:id', AdminFoodCategoryController.getById);
router.post('/', AdminFoodCategoryController.create);
router.put('/:id', AdminFoodCategoryController.update);
router.delete('/:id', AdminFoodCategoryController.remove);

module.exports = router;
