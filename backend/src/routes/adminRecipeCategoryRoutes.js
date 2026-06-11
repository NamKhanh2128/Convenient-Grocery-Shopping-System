const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminRecipeCategoryController = require('../controllers/AdminRecipeCategoryController');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/',              AdminRecipeCategoryController.list);
router.get('/:id',           AdminRecipeCategoryController.getById);
router.post('/',             AdminRecipeCategoryController.create);
router.put('/:id',           AdminRecipeCategoryController.update);
router.delete('/:id',        AdminRecipeCategoryController.remove);
router.post('/bulk-delete',  AdminRecipeCategoryController.bulkDelete);

module.exports = router;
