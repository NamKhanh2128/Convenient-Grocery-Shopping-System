const express = require('express');
const MealPlanController = require('../controllers/MealPlanController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

router.get('/', MealPlanController.list);
router.post('/', MealPlanController.add);
router.delete('/', MealPlanController.remove);
router.patch('/replace', MealPlanController.replace);

module.exports = router;
