const AdminShoppingModel = require('../models/AdminShoppingModel');

class AdminShoppingController {
  static async list(req, res) {
    try {
      const { search, status } = req.query;
      const lists = await AdminShoppingModel.list({ search, status });
      return res.status(200).json({ success: true, data: { lists } });
    } catch (err) {
      console.error('[AdminShopping.list]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách mua sắm.' });
    }
  }

  static async getById(req, res) {
    try {
      const list = await AdminShoppingModel.getById(req.params.id);
      if (!list) return res.status(404).json({ success: false, message: 'Không tìm thấy danh sách mua sắm.' });
      return res.status(200).json({ success: true, data: list });
    } catch (err) {
      console.error('[AdminShopping.getById]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách mua sắm.' });
    }
  }

  static async update(req, res) {
    try {
      const { name, status, plan_date, assigned_user_id } = req.body;
      const list = await AdminShoppingModel.update(req.params.id, { name, status, plan_date, assigned_user_id });
      return res.status(200).json({ success: true, data: list, message: 'Cập nhật danh sách mua sắm thành công.' });
    } catch (err) {
      console.error('[AdminShopping.update]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async remove(req, res) {
    try {
      await AdminShoppingModel.delete(req.params.id);
      return res.status(200).json({ success: true, message: 'Đã xóa danh sách mua sắm.' });
    } catch (err) {
      console.error('[AdminShopping.remove]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async bulkDelete(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ.' });
      }
      await AdminShoppingModel.bulkDelete(ids);
      return res.status(200).json({ success: true, message: `Đã xóa ${ids.length} danh sách mua sắm.` });
    } catch (err) {
      console.error('[AdminShopping.bulkDelete]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async updateItem(req, res) {
    try {
      const { is_purchased, item_status, bought_quantity, remaining_quantity } = req.body;
      await AdminShoppingModel.updateItem(req.params.itemId, { is_purchased, item_status, bought_quantity, remaining_quantity });
      const list = await AdminShoppingModel.getById(req.params.id);
      return res.status(200).json({ success: true, data: list, message: 'Cập nhật mục mua sắm thành công.' });
    } catch (err) {
      console.error('[AdminShopping.updateItem]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async removeItem(req, res) {
    try {
      await AdminShoppingModel.deleteItem(req.params.itemId);
      const list = await AdminShoppingModel.getById(req.params.id);
      return res.status(200).json({ success: true, data: list, message: 'Đã xóa mục mua sắm.' });
    } catch (err) {
      console.error('[AdminShopping.removeItem]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async getUsers(req, res) {
    try {
      const users = await AdminShoppingModel.getUsers();
      return res.status(200).json({ success: true, data: { users } });
    } catch (err) {
      console.error('[AdminShopping.getUsers]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách người dùng.' });
    }
  }
}

module.exports = AdminShoppingController;
