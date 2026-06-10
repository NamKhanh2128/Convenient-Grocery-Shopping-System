const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminStatsController = require('../controllers/AdminStatsController');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/summary',          AdminStatsController.summary);
router.get('/meals-by-day',     AdminStatsController.mealsByDay);
router.get('/foods-by-category', AdminStatsController.foodsByCategory);
router.get('/top-recipes',      AdminStatsController.topRecipes);
router.get('/families',         AdminStatsController.getFamilies);

module.exports = router;
