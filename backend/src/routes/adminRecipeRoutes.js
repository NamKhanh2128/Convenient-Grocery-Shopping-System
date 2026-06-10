const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminRecipeController = require('../controllers/AdminRecipeController');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/',             AdminRecipeController.list);
router.get('/:id',          AdminRecipeController.getById);
router.post('/',            AdminRecipeController.create);
router.put('/:id',          AdminRecipeController.update);
router.delete('/:id',       AdminRecipeController.remove);
router.post('/bulk-delete', AdminRecipeController.bulkDelete);

module.exports = router;
