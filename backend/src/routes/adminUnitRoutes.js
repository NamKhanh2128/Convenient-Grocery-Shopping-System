const express = require('express');
const { authRequired } = require('../middleware/auth');
const { adminRequired } = require('../middleware/adminRequired');
const AdminUnitController = require('../controllers/AdminUnitController');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/', AdminUnitController.list);
router.post('/bulk-delete', AdminUnitController.bulkDelete);
router.get('/:id', AdminUnitController.getById);
router.post('/', AdminUnitController.create);
router.put('/:id', AdminUnitController.update);
router.delete('/:id', AdminUnitController.remove);

module.exports = router;
