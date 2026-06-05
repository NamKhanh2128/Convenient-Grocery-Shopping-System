const MealPlanModel = require('../models/MealPlanModel');

function getContext(req) {
  return {
    familyGroupId:
      req.query.familyGroupId || req.body?.familyGroupId || req.user?.gia_dinh_id || String(req.user?.family_id) || null,
  };
}

class MealPlanController {
  static async list(req, res) {
    try {
      const { familyGroupId } = getContext(req);
      if (!familyGroupId) {
        return res.status(400).json({ success: false, message: 'Thiếu familyGroupId' });
      }
      const items = await MealPlanModel.listByFamily(familyGroupId, {
        fromDate: req.query.from || null,
        toDate: req.query.to || null,
      });
      return res.status(200).json({
        success: true,
        data: {
          items: items.map((row) => ({
            meal_plan_id: String(row.id),
            family_id: String(familyGroupId),
            meal_date: String(row.ngay_an).slice(0, 10),
            meal_type: row.bua_an,
            recipe_id: String(row.cong_thuc_id),
            recipe_name: row.ten_mon_an,
          })),
        },
        message: 'Lấy kế hoạch bữa ăn thành công',
      });
    } catch (error) {
      console.error('[MealPlanController.list]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy kế hoạch bữa ăn' });
    }
  }

  static async add(req, res) {
    try {
      const { familyGroupId } = getContext(req);
      const { meal_date, meal_type, recipe_id } = req.body;
      if (!familyGroupId || !meal_date || !meal_type || !recipe_id) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bữa ăn' });
      }
      await MealPlanModel.addEntry({
        familyGroupId,
        mealDate: meal_date,
        mealType: meal_type,
        recipeId: recipe_id,
      });
      return res.status(201).json({ success: true, data: null, message: 'Đã thêm món vào kế hoạch' });
    } catch (error) {
      console.error('[MealPlanController.add]', error);
      return res.status(400).json({ success: false, message: error.message || 'Không thể thêm món' });
    }
  }

  static async remove(req, res) {
    try {
      const { familyGroupId } = getContext(req);
      const { meal_date, meal_type, recipe_id } = req.body;
      if (!familyGroupId || !meal_date || !meal_type || !recipe_id) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bữa ăn' });
      }
      await MealPlanModel.removeEntry({
        familyGroupId,
        mealDate: meal_date,
        mealType: meal_type,
        recipeId: recipe_id,
      });
      return res.status(200).json({ success: true, data: null, message: 'Đã xóa món khỏi kế hoạch' });
    } catch (error) {
      console.error('[MealPlanController.remove]', error);
      return res.status(400).json({ success: false, message: error.message || 'Không thể xóa món' });
    }
  }

  static async replace(req, res) {
    try {
      const { familyGroupId } = getContext(req);
      const { meal_date, meal_type, old_recipe_id, new_recipe_id } = req.body;
      if (!familyGroupId || !meal_date || !meal_type || !old_recipe_id || !new_recipe_id) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin thay thế' });
      }
      await MealPlanModel.replaceEntry({
        familyGroupId,
        mealDate: meal_date,
        mealType: meal_type,
        oldRecipeId: old_recipe_id,
        newRecipeId: new_recipe_id,
      });
      return res.status(200).json({ success: true, data: null, message: 'Đã thay thế món' });
    } catch (error) {
      console.error('[MealPlanController.replace]', error);
      return res.status(400).json({ success: false, message: error.message || 'Không thể thay thế món' });
    }
  }
}

module.exports = MealPlanController;
