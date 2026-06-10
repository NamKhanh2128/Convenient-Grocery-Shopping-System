const AdminRecipeModel = require('../models/AdminRecipeModel');

class AdminRecipeController {
  static async list(req, res) {
    try {
      const { search } = req.query;
      const recipes = await AdminRecipeModel.list({ search });
      return res.status(200).json({ success: true, data: { recipes } });
    } catch (err) {
      console.error('[AdminRecipe.list]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách công thức.' });
    }
  }

  static async getById(req, res) {
    try {
      const recipe = await AdminRecipeModel.getById(req.params.id);
      if (!recipe) return res.status(404).json({ success: false, message: 'Không tìm thấy công thức.' });
      return res.status(200).json({ success: true, data: recipe });
    } catch (err) {
      console.error('[AdminRecipe.getById]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  }

  static async create(req, res) {
    try {
      const { recipe_name, description, image_url, time_minutes, calories, difficulty, instructions, ingredients } = req.body;
      if (!recipe_name) {
        return res.status(400).json({ success: false, message: 'Tên công thức là bắt buộc.' });
      }
      const recipe = await AdminRecipeModel.create({ recipe_name, description, image_url, time_minutes, calories, difficulty, instructions, ingredients });
      return res.status(201).json({ success: true, data: recipe, message: 'Tạo công thức thành công.' });
    } catch (err) {
      console.error('[AdminRecipe.create]', err);
      return res.status(err.message.includes('tồn tại') ? 409 : 400).json({ success: false, message: err.message });
    }
  }

  static async update(req, res) {
    try {
      const recipe = await AdminRecipeModel.update(req.params.id, req.body);
      if (!recipe) return res.status(404).json({ success: false, message: 'Không tìm thấy công thức.' });
      return res.status(200).json({ success: true, data: recipe, message: 'Cập nhật công thức thành công.' });
    } catch (err) {
      console.error('[AdminRecipe.update]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async remove(req, res) {
    try {
      await AdminRecipeModel.delete(req.params.id);
      return res.status(200).json({ success: true, message: 'Đã xóa công thức.' });
    } catch (err) {
      console.error('[AdminRecipe.remove]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 500).json({ success: false, message: err.message });
    }
  }

  static async bulkDelete(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ.' });
      }
      await AdminRecipeModel.bulkDelete(ids);
      return res.status(200).json({ success: true, message: `Đã xóa ${ids.length} công thức.` });
    } catch (err) {
      console.error('[AdminRecipe.bulkDelete]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = AdminRecipeController;
