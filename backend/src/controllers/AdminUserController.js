const AdminUserModel = require('../models/AdminUserModel');

class AdminUserController {
  static async list(req, res) {
    try {
      const { search, role, locked, page = 1, limit = 10 } = req.query;
      const result = await AdminUserModel.list({ search, role, locked, page, limit });
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('[AdminUser.list]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách người dùng.' });
    }
  }

  static async getById(req, res) {
    try {
      const user = await AdminUserModel.getById(req.params.id);
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      console.error('[AdminUser.getById]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
  }

  static async create(req, res) {
    try {
      const { full_name, email, phone, password, role } = req.body;
      if (!full_name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (full_name, email, password).' });
      }
      // Validate password: min 8 chars, 1 uppercase, 1 digit
      if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa và 1 chữ số.',
        });
      }
      const user = await AdminUserModel.create({ full_name, email, phone, password, role });
      return res.status(201).json({ success: true, data: user, message: 'Tạo người dùng thành công.' });
    } catch (err) {
      console.error('[AdminUser.create]', err);
      const status = err.message.includes('tồn tại') ? 409 : 400;
      return res.status(status).json({ success: false, message: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { full_name, email, phone, role } = req.body;
      const user = await AdminUserModel.update(req.params.id, { full_name, email, phone, role });
      return res.status(200).json({ success: true, data: user, message: 'Cập nhật người dùng thành công.' });
    } catch (err) {
      console.error('[AdminUser.update]', err);
      const status = err.message.includes('tồn tại') ? 409 : err.message.includes('tìm thấy') ? 404 : 400;
      return res.status(status).json({ success: false, message: err.message });
    }
  }

  static async toggleLock(req, res) {
    try {
      const result = await AdminUserModel.toggleLock(req.params.id, req.user.user_id);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Trạng thái khóa tài khoản đã thay đổi.',
      });
    } catch (err) {
      console.error('[AdminUser.toggleLock]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { new_password } = req.body;
      if (!new_password) {
        return res.status(400).json({ success: false, message: 'Thiếu mật khẩu mới.' });
      }
      await AdminUserModel.resetPassword(req.params.id, new_password);
      return res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công.' });
    } catch (err) {
      console.error('[AdminUser.resetPassword]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 500).json({ success: false, message: err.message });
    }
  }

  static async remove(req, res) {
    try {
      await AdminUserModel.delete(req.params.id, req.user.user_id);
      return res.status(200).json({ success: true, message: 'Đã xóa người dùng.' });
    } catch (err) {
      console.error('[AdminUser.remove]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async bulkDelete(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ.' });
      }
      await AdminUserModel.bulkDelete(ids, req.user.user_id);
      return res.status(200).json({ success: true, message: `Đã xóa ${ids.length} người dùng.` });
    } catch (err) {
      console.error('[AdminUser.bulkDelete]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = AdminUserController;
