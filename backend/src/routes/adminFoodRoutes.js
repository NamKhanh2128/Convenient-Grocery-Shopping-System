const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminFoodController = require('../controllers/AdminFoodController');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/',              AdminFoodController.list);
router.post('/bulk-delete',  AdminFoodController.bulkDelete);
router.get('/:id',           AdminFoodController.getById);
router.post('/',             AdminFoodController.create);
router.put('/:id',           AdminFoodController.update);
router.delete('/:id',        AdminFoodController.remove);

module.exports = router;
