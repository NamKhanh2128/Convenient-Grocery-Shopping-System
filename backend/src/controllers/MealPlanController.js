const MealPlanModel = require('../models/MealPlanModel');

function getContext(req) {
  return {
    userId: req.user?.user_id || req.user?.id,
    familyGroupId: req.query.familyGroupId || req.body?.familyGroupId || String(req.user?.family_id || '') || null,
  };
}

class MealPlanController {
  static async list(req, res) {
    try {
      const { familyGroupId, userId } = getContext(req);
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing userId' });
      }

      const items = await MealPlanModel.listByFamily(familyGroupId, {
        fromDate: req.query.from || null,
        toDate: req.query.to || null,
        userId,
      });

      return res.status(200).json({
        success: true,
        data: {
          items: items.map((row) => ({
            meal_plan_id: String(row.meal_plan_id || row.id),
            family_id: String(familyGroupId || ''),
            meal_date: String(row.meal_date).slice(0, 10),
            meal_type: row.meal_type,
            recipe_id: String(row.recipe_id),
            recipe_name: row.recipe_name,
          })),
        },
        message: 'Meal plan loaded successfully',
      });
    } catch (error) {
      console.error('[MealPlanController.list]', error);
      return res.status(500).json({ success: false, message: error.message || 'Cannot load meal plan' });
    }
  }

  static async add(req, res) {
    try {
      const { userId } = getContext(req);
      const { meal_date, meal_type, recipe_id } = req.body;
      if (!userId || !meal_date || !meal_type || !recipe_id) {
        return res.status(400).json({ success: false, message: 'Missing meal plan fields' });
      }

      await MealPlanModel.addEntry({ userId, mealDate: meal_date, mealType: meal_type, recipeId: recipe_id });
      return res.status(201).json({ success: true, data: null, message: 'Recipe added to meal plan' });
    } catch (error) {
      console.error('[MealPlanController.add]', error);
      return res.status(400).json({ success: false, message: error.message || 'Cannot add meal plan item' });
    }
  }

  static async remove(req, res) {
    try {
      const { userId } = getContext(req);
      const { meal_date, meal_type, recipe_id } = req.body;
      if (!userId || !meal_date || !meal_type || !recipe_id) {
        return res.status(400).json({ success: false, message: 'Missing meal plan fields' });
      }

      await MealPlanModel.removeEntry({ userId, mealDate: meal_date, mealType: meal_type, recipeId: recipe_id });
      return res.status(200).json({ success: true, data: null, message: 'Recipe removed from meal plan' });
    } catch (error) {
      console.error('[MealPlanController.remove]', error);
      return res.status(400).json({ success: false, message: error.message || 'Cannot remove meal plan item' });
    }
  }

  static async replace(req, res) {
    try {
      const { userId } = getContext(req);
      const { meal_date, meal_type, old_recipe_id, new_recipe_id } = req.body;
      if (!userId || !meal_date || !meal_type || !old_recipe_id || !new_recipe_id) {
        return res.status(400).json({ success: false, message: 'Missing replacement fields' });
      }

      await MealPlanModel.replaceEntry({
        userId,
        mealDate: meal_date,
        mealType: meal_type,
        oldRecipeId: old_recipe_id,
        newRecipeId: new_recipe_id,
      });
      return res.status(200).json({ success: true, data: null, message: 'Meal plan item replaced' });
    } catch (error) {
      console.error('[MealPlanController.replace]', error);
      return res.status(400).json({ success: false, message: error.message || 'Cannot replace meal plan item' });
    }
  }
}

module.exports = MealPlanController;
