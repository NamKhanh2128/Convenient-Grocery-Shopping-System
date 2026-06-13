const express = require('express');
const RecipeController = require('../controllers/RecipeController');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/public', RecipeController.listPublic);
router.get('/public/:id', RecipeController.detailPublic);

router.use(authRequired);

router.get('/suggest/from-fridge', RecipeController.suggestFromFridge);
router.get('/popular', RecipeController.popular);
router.get('/favorites', RecipeController.listFavorites);

router.get('/', RecipeController.list);
router.post('/', RecipeController.create);

router.get('/:id/missing-ingredients', RecipeController.getMissingIngredients);
router.post('/:id/mark-cooked', RecipeController.markCooked);
router.post('/:id/shopping-list', RecipeController.createShoppingList);
router.post('/:id/favorite', RecipeController.addFavorite);
router.delete('/:id/favorite', RecipeController.removeFavorite);

router.get('/:id', RecipeController.detail);
router.put('/:id', RecipeController.update);
router.delete('/:id', RecipeController.remove);

module.exports = router;
