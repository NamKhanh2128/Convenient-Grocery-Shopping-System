const AdminRecipeCategoryModel = require('../models/AdminRecipeCategoryModel');

class AdminRecipeCategoryController {
  static async list(req, res) {
    try {
      const { search } = req.query;
      const categories = await AdminRecipeCategoryModel.list({ search });
      return res.status(200).json({ success: true, data: { categories } });
    } catch (err) {
      console.error('[AdminRecipeCategory.list]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách danh mục công thức.' });
    }
  }

  static async getById(req, res) {
    try {
      const category = await AdminRecipeCategoryModel.getById(req.params.id);
      if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục công thức.' });
      return res.status(200).json({ success: true, data: category });
    } catch (err) {
      console.error('[AdminRecipeCategory.getById]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh mục công thức.' });
    }
  }

  static async create(req, res) {
    try {
      const { ten_danh_muc, mo_ta } = req.body;
      if (!ten_danh_muc) return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc.' });
      const category = await AdminRecipeCategoryModel.create({ ten_danh_muc, mo_ta });
      return res.status(201).json({ success: true, data: category, message: 'Thêm danh mục công thức thành công.' });
    } catch (err) {
      console.error('[AdminRecipeCategory.create]', err);
      return res.status(err.message.includes('tồn tại') ? 409 : 400).json({ success: false, message: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { ten_danh_muc, mo_ta } = req.body;
      const category = await AdminRecipeCategoryModel.update(req.params.id, { ten_danh_muc, mo_ta });
      return res.status(200).json({ success: true, data: category, message: 'Cập nhật danh mục công thức thành công.' });
    } catch (err) {
      console.error('[AdminRecipeCategory.update]', err);
      return res.status(err.message.includes('tồn tại') ? 409 : err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async remove(req, res) {
    try {
      await AdminRecipeCategoryModel.delete(req.params.id);
      return res.status(200).json({ success: true, message: 'Đã xóa danh mục công thức.' });
    } catch (err) {
      console.error('[AdminRecipeCategory.remove]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async bulkDelete(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ.' });
      }
      await AdminRecipeCategoryModel.bulkDelete(ids);
      return res.status(200).json({ success: true, message: `Đã xóa ${ids.length} danh mục công thức.` });
    } catch (err) {
      console.error('[AdminRecipeCategory.bulkDelete]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = AdminRecipeCategoryController;
