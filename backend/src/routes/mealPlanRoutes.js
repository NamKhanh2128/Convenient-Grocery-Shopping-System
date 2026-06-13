const express = require('express');
const MealPlanController = require('../controllers/MealPlanController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/missing-ingredients', MealPlanController.getMissingIngredients);
router.get('/', MealPlanController.list);
router.post('/auto-generate', MealPlanController.autoGenerate);
router.post('/', MealPlanController.add);
router.delete('/', MealPlanController.remove);
router.patch('/replace', MealPlanController.replace);
router.patch('/cook', MealPlanController.cook);

module.exports = router;
