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
      const { name_vi, name_en, description, instructions, prep_time, cook_time, servings, is_public, created_by, ingredients } = req.body;
      if (!name_vi || !name_en) {
        return res.status(400).json({ success: false, message: 'Tên công thức (Tiếng Việt và Tiếng Anh) là bắt buộc.' });
      }
      if (!instructions || (typeof instructions === 'string' && !instructions.trim())) {
        return res.status(400).json({ success: false, message: 'Hướng dẫn thực hiện là bắt buộc.' });
      }
      const recipe = await AdminRecipeModel.create({ name_vi, name_en, description, instructions, prep_time, cook_time, servings, is_public, created_by, ingredients });
      return res.status(201).json({ success: true, data: recipe, message: 'Tạo công thức thành công.' });
    } catch (err) {
      console.error('[AdminRecipe.create]', err);
      return res.status(err.message.includes('tồn tại') ? 409 : 400).json({ success: false, message: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { name_vi, name_en, description, instructions, prep_time, cook_time, servings, is_public, created_by, ingredients } = req.body;
      const recipe = await AdminRecipeModel.update(req.params.id, { name_vi, name_en, description, instructions, prep_time, cook_time, servings, is_public, created_by, ingredients });
      if (!recipe) return res.status(404).json({ success: false, message: 'Không tìm thấy công thức.' });
      return res.status(200).json({ success: true, data: recipe, message: 'Cập nhật công thức thành công.' });
    } catch (err) {
      console.error('[AdminRecipe.update]', err);
      const status = err.message.includes('tồn tại') ? 409 : err.message.includes('tìm thấy') ? 404 : 400;
      return res.status(status).json({ success: false, message: err.message });
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

  static async getUnits(req, res) {
    try {
      const units = await AdminRecipeModel.getUnits();
      return res.status(200).json({ success: true, data: { units } });
    } catch (err) {
      console.error('[AdminRecipe.getUnits]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách đơn vị tính.' });
    }
  }

  static async getCategories(req, res) {
    try {
      const categories = await AdminRecipeModel.getCategories();
      return res.status(200).json({ success: true, data: { categories } });
    } catch (err) {
      console.error('[AdminRecipe.getCategories]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách danh mục.' });
    }
  }
}

module.exports = AdminRecipeController;
