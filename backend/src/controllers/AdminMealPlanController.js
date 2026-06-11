const AdminMealPlanModel = require('../models/AdminMealPlanModel');

class AdminMealPlanController {
  static async list(req, res) {
    try {
      const { search, status } = req.query;
      const plans = await AdminMealPlanModel.list({ search, status });
      return res.status(200).json({ success: true, data: { plans } });
    } catch (err) {
      console.error('[AdminMealPlan.list]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách kế hoạch bữa ăn.' });
    }
  }

  static async getById(req, res) {
    try {
      const plan = await AdminMealPlanModel.getById(req.params.id);
      if (!plan) return res.status(404).json({ success: false, message: 'Không tìm thấy kế hoạch bữa ăn.' });
      return res.status(200).json({ success: true, data: plan });
    } catch (err) {
      console.error('[AdminMealPlan.getById]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy kế hoạch bữa ăn.' });
    }
  }

  static async update(req, res) {
    try {
      const { plan_type, start_date, end_date, status } = req.body;
      const plan = await AdminMealPlanModel.update(req.params.id, { plan_type, start_date, end_date, status });
      return res.status(200).json({ success: true, data: plan, message: 'Cập nhật kế hoạch bữa ăn thành công.' });
    } catch (err) {
      console.error('[AdminMealPlan.update]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async remove(req, res) {
    try {
      await AdminMealPlanModel.delete(req.params.id);
      return res.status(200).json({ success: true, message: 'Đã xóa kế hoạch bữa ăn.' });
    } catch (err) {
      console.error('[AdminMealPlan.remove]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async bulkDelete(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ.' });
      }
      await AdminMealPlanModel.bulkDelete(ids);
      return res.status(200).json({ success: true, message: `Đã xóa ${ids.length} kế hoạch bữa ăn.` });
    } catch (err) {
      console.error('[AdminMealPlan.bulkDelete]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async updateItem(req, res) {
    try {
      const { is_cooked, meal_date, meal_type, recipe_id } = req.body;
      await AdminMealPlanModel.updateItem(req.params.itemId, { is_cooked, meal_date, meal_type, recipe_id });
      const plan = await AdminMealPlanModel.getById(req.params.id);
      return res.status(200).json({ success: true, data: plan, message: 'Cập nhật mục kế hoạch bữa ăn thành công.' });
    } catch (err) {
      console.error('[AdminMealPlan.updateItem]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async removeItem(req, res) {
    try {
      await AdminMealPlanModel.deleteItem(req.params.itemId);
      const plan = await AdminMealPlanModel.getById(req.params.id);
      return res.status(200).json({ success: true, data: plan, message: 'Đã xóa mục kế hoạch bữa ăn.' });
    } catch (err) {
      console.error('[AdminMealPlan.removeItem]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async getUsers(req, res) {
    try {
      const users = await AdminMealPlanModel.getUsers();
      return res.status(200).json({ success: true, data: { users } });
    } catch (err) {
      console.error('[AdminMealPlan.getUsers]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách người dùng.' });
    }
  }

  static async getRecipes(req, res) {
    try {
      const recipes = await AdminMealPlanModel.getRecipes();
      return res.status(200).json({ success: true, data: { recipes } });
    } catch (err) {
      console.error('[AdminMealPlan.getRecipes]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách công thức.' });
    }
  }
}

module.exports = AdminMealPlanController;
