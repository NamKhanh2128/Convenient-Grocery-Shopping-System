const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminSettingsController = require('../controllers/AdminSettingsController');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/export-data',    AdminSettingsController.exportData);
router.post('/reset-database', AdminSettingsController.resetDatabase);

module.exports = router;
