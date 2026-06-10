const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminUserController = require('../controllers/AdminUserController');

const router = express.Router();

// Apply auth + admin check to all routes in this file
router.use(authRequired, adminRequired);

router.get('/',                       AdminUserController.list);
router.get('/:id',                    AdminUserController.getById);
router.post('/',                      AdminUserController.create);
router.put('/:id',                    AdminUserController.update);
router.post('/:id/toggle-lock',       AdminUserController.toggleLock);
router.post('/:id/reset-password',    AdminUserController.resetPassword);
router.delete('/:id',                 AdminUserController.remove);
router.post('/bulk-delete',           AdminUserController.bulkDelete);

module.exports = router;
