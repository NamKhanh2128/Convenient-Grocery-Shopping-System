const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminFamilyController = require('../controllers/AdminFamilyController');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/',              AdminFamilyController.list);
router.get('/:id/members',   AdminFamilyController.getMembers);
router.delete('/:id',        AdminFamilyController.remove);

module.exports = router;
