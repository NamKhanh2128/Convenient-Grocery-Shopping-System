const AdminFoodModel = require('../models/AdminFoodModel');

class AdminFoodController {
  static async list(req, res) {
    try {
      const { search, category_id } = req.query;
      const foods = await AdminFoodModel.list({ search, category_id });
      return res.status(200).json({ success: true, data: { foods } });
    } catch (err) {
      console.error('[AdminFood.list]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách thực phẩm.' });
    }
  }

  static async getById(req, res) {
    try {
      const food = await AdminFoodModel.getById(req.params.id);
      if (!food) return res.status(404).json({ success: false, message: 'Không tìm thấy thực phẩm.' });
      return res.status(200).json({ success: true, data: food });
    } catch (err) {
      console.error('[AdminFood.getById]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thực phẩm.' });
    }
  }

  static async create(req, res) {
    try {
      const { food_name, category_id, unit_id, icon } = req.body;
      if (!food_name) return res.status(400).json({ success: false, message: 'Tên thực phẩm là bắt buộc.' });
      if (!category_id) return res.status(400).json({ success: false, message: 'Danh mục thực phẩm là bắt buộc.' });
      if (!unit_id) return res.status(400).json({ success: false, message: 'Đơn vị tính là bắt buộc.' });
      const food = await AdminFoodModel.create({ food_name, category_id, unit_id, icon });
      return res.status(201).json({ success: true, data: food, message: 'Thêm thực phẩm thành công.' });
    } catch (err) {
      console.error('[AdminFood.create]', err);
      return res.status(err.message.includes('tồn tại') ? 409 : 400).json({ success: false, message: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { food_name, category_id, unit_id, icon } = req.body;
      const food = await AdminFoodModel.update(req.params.id, { food_name, category_id, unit_id, icon });
      if (!food) return res.status(404).json({ success: false, message: 'Không tìm thấy thực phẩm.' });
      return res.status(200).json({ success: true, data: food, message: 'Cập nhật thực phẩm thành công.' });
    } catch (err) {
      console.error('[AdminFood.update]', err);
      return res.status(err.message.includes('tồn tại') ? 409 : 400).json({ success: false, message: err.message });
    }
  }

  static async remove(req, res) {
    try {
      await AdminFoodModel.delete(req.params.id);
      return res.status(200).json({ success: true, message: 'Đã xóa thực phẩm.' });
    } catch (err) {
      console.error('[AdminFood.remove]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async bulkDelete(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ.' });
      }
      await AdminFoodModel.bulkDelete(ids);
      return res.status(200).json({ success: true, message: `Đã xóa ${ids.length} thực phẩm.` });
    } catch (err) {
      console.error('[AdminFood.bulkDelete]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = AdminFoodController;
