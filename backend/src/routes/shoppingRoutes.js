import { Router } from 'express';
import { ctrl } from '../controllers/ShoppingController.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.get('/', ctrl.getLists);
router.post('/', ctrl.createList);
router.get('/:listId', ctrl.getListDetail);
router.delete('/:listId', ctrl.deleteList);
router.post('/:listId/items', ctrl.addItem);
router.delete('/:listId/items', ctrl.deleteItems);
router.patch('/:listId/items/:itemId/purchased', ctrl.recordPurchase);
router.patch('/:listId/complete', ctrl.completeList);

export default router;
