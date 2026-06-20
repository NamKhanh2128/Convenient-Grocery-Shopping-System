const express = require('express');
const StatsController = require('../controllers/StatsController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);

router.get('/overview', StatsController.overview);
router.get('/daily-activity', StatsController.dailyActivity);
router.get('/category-bar', StatsController.categoryBar);
router.get('/purchase-trend', StatsController.purchaseTrend);
router.get('/food-trends', StatsController.foodTrends);
router.get('/waste-report', StatsController.wasteReport);
router.get('/purchase-trend-by-food', StatsController.purchaseTrendByFood);
router.get('/fridge-stock-by-food', StatsController.fridgeStockByFood);
router.get('/consumption-by-food', StatsController.consumptionByFood);
router.get('/waste-by-food', StatsController.wasteByFood);
router.get('/shopping-list-stats', StatsController.shoppingListStats);

module.exports = router;
