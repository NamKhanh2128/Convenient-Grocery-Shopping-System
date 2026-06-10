const AdminActivityModel = require('../models/AdminActivityModel');

class AdminActivityController {
  static async list(req, res) {
    try {
      const { search, action_type, page = 1, limit = 20 } = req.query;
      const result = await AdminActivityModel.list({ search, action_type, page, limit });
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('[AdminActivity.list]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy nhật ký hoạt động.' });
    }
  }
}

module.exports = AdminActivityController;
