const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminNotificationController = require('../controllers/AdminNotificationController');

const router = express.Router();
router.use(authRequired, adminRequired);

// Special action routes (must come before /:id to avoid param conflicts)
router.post('/bulk-delete',    AdminNotificationController.bulkDelete);
router.post('/bulk-read',      AdminNotificationController.bulkMarkAsRead);
router.post('/mark-all-read',  AdminNotificationController.markAllAsRead);

// CRUD routes
router.get('/',              AdminNotificationController.list);
router.get('/:id',           AdminNotificationController.getById);
router.patch('/:id/read',    AdminNotificationController.markAsRead);
router.delete('/:id',        AdminNotificationController.remove);

module.exports = router;
