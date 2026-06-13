const AdminFoodCategoryModel = require('../models/AdminFoodCategoryModel');

class AdminFoodCategoryController {
  static async list(req, res) {
    try {
      const { search } = req.query;
      const categories = await AdminFoodCategoryModel.list({ search });
      return res.status(200).json({ success: true, data: { categories } });
    } catch (err) {
      console.error('[AdminFoodCategory.list]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách danh mục thực phẩm.' });
    }
  }

  static async getById(req, res) {
    try {
      const category = await AdminFoodCategoryModel.getById(req.params.id);
      if (!category) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục thực phẩm.' });
      return res.status(200).json({ success: true, data: category });
    } catch (err) {
      console.error('[AdminFoodCategory.getById]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh mục thực phẩm.' });
    }
  }

  static async create(req, res) {
    try {
      const { name_vi, name_en, description } = req.body;
      if (!name_vi?.trim()) return res.status(400).json({ success: false, message: 'Tên tiếng Việt là bắt buộc.' });
      const category = await AdminFoodCategoryModel.create({ name_vi, name_en, description });
      return res.status(201).json({ success: true, data: category, message: 'Thêm danh mục thực phẩm thành công.' });
    } catch (err) {
      console.error('[AdminFoodCategory.create]', err);
      return res.status(err.message.includes('tồn tại') ? 409 : 400).json({ success: false, message: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { name_vi, name_en, description } = req.body;
      const category = await AdminFoodCategoryModel.update(req.params.id, { name_vi, name_en, description });
      return res.status(200).json({ success: true, data: category, message: 'Cập nhật danh mục thực phẩm thành công.' });
    } catch (err) {
      console.error('[AdminFoodCategory.update]', err);
      return res.status(err.message.includes('tồn tại') ? 409 : err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async remove(req, res) {
    try {
      await AdminFoodCategoryModel.delete(req.params.id);
      return res.status(200).json({ success: true, message: 'Đã xóa danh mục thực phẩm.' });
    } catch (err) {
      console.error('[AdminFoodCategory.remove]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async bulkDelete(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ.' });
      }
      await AdminFoodCategoryModel.bulkDelete(ids);
      return res.status(200).json({ success: true, message: `Đã xóa ${ids.length} danh mục thực phẩm.` });
    } catch (err) {
      console.error('[AdminFoodCategory.bulkDelete]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = AdminFoodCategoryController;
