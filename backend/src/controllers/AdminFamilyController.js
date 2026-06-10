const AdminFamilyModel = require('../models/AdminFamilyModel');

class AdminFamilyController {
  static async list(req, res) {
    try {
      const { search } = req.query;
      const families = await AdminFamilyModel.list({ search });
      return res.status(200).json({ success: true, data: { families } });
    } catch (err) {
      console.error('[AdminFamily.list]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách gia đình.' });
    }
  }

  static async getMembers(req, res) {
    try {
      const members = await AdminFamilyModel.getMembers(req.params.id);
      return res.status(200).json({ success: true, data: { members } });
    } catch (err) {
      console.error('[AdminFamily.getMembers]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách thành viên.' });
    }
  }

  static async remove(req, res) {
    try {
      await AdminFamilyModel.delete(req.params.id);
      return res.status(200).json({ success: true, message: 'Đã xóa nhóm gia đình vĩnh viễn.' });
    } catch (err) {
      console.error('[AdminFamily.remove]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 500).json({ success: false, message: err.message });
    }
  }
}

module.exports = AdminFamilyController;
