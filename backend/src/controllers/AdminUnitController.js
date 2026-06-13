const AdminUnitModel = require('../models/AdminUnitModel');

class AdminUnitController {
  static async list(req, res) {
    try {
      const { search } = req.query;
      const units = await AdminUnitModel.list({ search });
      return res.status(200).json({ success: true, data: { units } });
    } catch (err) {
      console.error('[AdminUnit.list]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách đơn vị tính.' });
    }
  }

  static async getById(req, res) {
    try {
      const unit = await AdminUnitModel.getById(req.params.id);
      if (!unit) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn vị tính.' });
      return res.status(200).json({ success: true, data: unit });
    } catch (err) {
      console.error('[AdminUnit.getById]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy đơn vị tính.' });
    }
  }

  static async create(req, res) {
    try {
      const { name, symbol } = req.body;
      if (!name?.trim()) return res.status(400).json({ success: false, message: 'Tên đơn vị là bắt buộc.' });
      if (!symbol?.trim()) return res.status(400).json({ success: false, message: 'Ký hiệu đơn vị là bắt buộc.' });
      const unit = await AdminUnitModel.create({ name, symbol });
      return res.status(201).json({ success: true, data: unit, message: 'Thêm đơn vị tính thành công.' });
    } catch (err) {
      console.error('[AdminUnit.create]', err);
      return res.status(err.message.includes('tồn tại') ? 409 : 400).json({ success: false, message: err.message });
    }
  }

  static async update(req, res) {
    try {
      const { name, symbol } = req.body;
      const unit = await AdminUnitModel.update(req.params.id, { name, symbol });
      return res.status(200).json({ success: true, data: unit, message: 'Cập nhật đơn vị tính thành công.' });
    } catch (err) {
      console.error('[AdminUnit.update]', err);
      return res.status(err.message.includes('tồn tại') ? 409 : err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async remove(req, res) {
    try {
      await AdminUnitModel.delete(req.params.id);
      return res.status(200).json({ success: true, message: 'Đã xóa đơn vị tính.' });
    } catch (err) {
      console.error('[AdminUnit.remove]', err);
      return res.status(err.message.includes('tìm thấy') ? 404 : 400).json({ success: false, message: err.message });
    }
  }

  static async bulkDelete(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ.' });
      }
      await AdminUnitModel.bulkDelete(ids);
      return res.status(200).json({ success: true, message: `Đã xóa ${ids.length} đơn vị tính.` });
    } catch (err) {
      console.error('[AdminUnit.bulkDelete]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = AdminUnitController;
