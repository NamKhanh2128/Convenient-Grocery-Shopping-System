const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminActivityController = require('../controllers/AdminActivityController');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/', AdminActivityController.list);

module.exports = router;
