const express = require('express');
const FoodController = require('../controllers/FoodController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);
router.get('/', FoodController.list);

module.exports = router;
