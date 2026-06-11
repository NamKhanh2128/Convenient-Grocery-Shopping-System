const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminMealPlanController = require('../controllers/AdminMealPlanController');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/meta/users',   AdminMealPlanController.getUsers);
router.get('/meta/recipes', AdminMealPlanController.getRecipes);

router.get('/',                     AdminMealPlanController.list);
router.get('/:id',                  AdminMealPlanController.getById);
router.put('/:id',                  AdminMealPlanController.update);
router.delete('/:id',               AdminMealPlanController.remove);
router.post('/bulk-delete',         AdminMealPlanController.bulkDelete);
router.put('/:id/items/:itemId',    AdminMealPlanController.updateItem);
router.delete('/:id/items/:itemId', AdminMealPlanController.removeItem);

module.exports = router;
