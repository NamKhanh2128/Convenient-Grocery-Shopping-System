const MealPlanModel = require('../models/MealPlanModel');
const RecipeModel = require('../models/RecipeModel');

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
            is_cooked: Boolean(row.is_cooked),
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

  static async getMissingIngredients(req, res) {
    try {
      const { userId, familyGroupId } = getContext(req);
      const { from, to } = req.query;
      if (!userId || !from || !to) {
        return res.status(400).json({ success: false, message: 'Thiếu from/to date' });
      }
      const missing = await RecipeModel.getMissingForPlan({ userId, familyGroupId, fromDate: from, toDate: to });
      return res.status(200).json({ success: true, data: { missing }, message: 'OK' });
    } catch (error) {
      console.error('[MealPlanController.getMissingIngredients]', error);
      return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
    }
  }

  static async autoGenerate(req, res) {
    try {
      const { userId } = getContext(req);
      const { mode = 'day', date, overwrite = false } = req.body;
      if (!userId || !date) {
        return res.status(400).json({ success: false, message: 'Thiếu userId hoặc date' });
      }

      const anchor = String(date).slice(0, 10);
      let dates;
      if (mode === 'week') {
        // Fill from `anchor` through the Sunday of the week containing it
        // (Monday-Sunday weeks, matching the calendar UI) — NOT a fixed 7
        // days forward. This way, generating "for the week" while it's
        // already Thursday only fills Thursday..Sunday, not into next week.
        const d = new Date(anchor + 'T00:00:00');
        const weekday = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const daysUntilSunday = weekday === 0 ? 0 : 7 - weekday;
        dates = Array.from({ length: daysUntilSunday + 1 }, (_, i) => {
          const day = new Date(d);
          day.setDate(day.getDate() + i);
          // Local Y/M/D parts — toISOString would shift to UTC and roll the
          // date back a day in timezones ahead of UTC (e.g. UTC+7).
          return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        });
      } else {
        dates = [anchor];
      }

      const added = await MealPlanModel.autoGenerate({ userId, dates, overwrite });
      return res.status(200).json({
        success: true,
        data: { added },
        message: `Đã tạo tự động ${added.length} bữa ăn`,
      });
    } catch (error) {
      console.error('[MealPlanController.autoGenerate]', error);
      return res.status(400).json({ success: false, message: error.message || 'Không thể tạo kế hoạch tự động' });
    }
  }

  static async cook(req, res) {
    try {
      const { userId, familyGroupId } = getContext(req);
      const { meal_date, meal_type, recipe_id, is_cooked = true } = req.body;
      if (!userId || !meal_date || !meal_type || !recipe_id) {
        return res.status(400).json({ success: false, message: 'Missing fields for mark-cooked' });
      }

      if (is_cooked) {
        const wasCooked = await MealPlanModel.getItemCookedState({
          userId, mealDate: meal_date, mealType: meal_type, recipeId: recipe_id,
        });

        if (!wasCooked) {
          // Check if all ingredients are available before allowing mark-as-cooked
          const check = await RecipeModel.getMissingForRecipe({ recipeId: recipe_id, userId, familyGroupId });
          if (check && check.missing.length > 0) {
            return res.status(200).json({
              success: true,
              data: { can_cook: false, missing: check.missing },
              message: 'Thiếu nguyên liệu',
            });
          }

          // All ingredients available — deduct from fridge then mark cooked
          await RecipeModel.deductIngredientsBestEffort({ recipeId: recipe_id, userId, familyGroupId });
        }
      }

      await MealPlanModel.markCooked({
        userId,
        mealDate: meal_date,
        mealType: meal_type,
        recipeId: recipe_id,
        isCooked: is_cooked,
      });

      return res.status(200).json({ success: true, data: null, message: is_cooked ? 'Đã đánh dấu đã nấu' : 'Đã bỏ đánh dấu đã nấu' });
    } catch (error) {
      console.error('[MealPlanController.cook]', error);
      return res.status(400).json({ success: false, message: error.message || 'Cannot update cooked status' });
    }
  }
}

module.exports = MealPlanController;
