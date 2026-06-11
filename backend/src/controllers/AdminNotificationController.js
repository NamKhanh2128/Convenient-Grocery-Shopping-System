const AdminNotificationModel = require('../models/AdminNotificationModel');

class AdminNotificationController {
  /**
   * GET /api/admin/notifications
   * Query params: search, type, is_read, limit, offset
   */
  static async list(req, res) {
    try {
      const { search, type, is_read, limit = 50, offset = 0 } = req.query;
      const result = await AdminNotificationModel.list({ search, type, is_read, limit, offset });
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('[AdminNotification.list]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách thông báo.' });
    }
  }

  /**
   * GET /api/admin/notifications/:id
   */
  static async getById(req, res) {
    try {
      const notif = await AdminNotificationModel.getById(req.params.id);
      if (!notif) return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo.' });
      return res.status(200).json({ success: true, data: notif });
    } catch (err) {
      console.error('[AdminNotification.getById]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông báo.' });
    }
  }

  /**
   * PATCH /api/admin/notifications/:id/read
   * Mark a single notification as read.
   */
  static async markAsRead(req, res) {
    try {
      const notif = await AdminNotificationModel.markAsRead(req.params.id);
      return res.status(200).json({ success: true, data: notif, message: 'Đã đánh dấu thông báo là đã đọc.' });
    } catch (err) {
      console.error('[AdminNotification.markAsRead]', err);
      const status = err.message.includes('tìm thấy') ? 404 : 400;
      return res.status(status).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/notifications/bulk-read
   * Body: { ids: number[] }
   */
  static async bulkMarkAsRead(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ.' });
      }
      await AdminNotificationModel.bulkMarkAsRead(ids);
      return res.status(200).json({ success: true, message: `Đã đánh dấu ${ids.length} thông báo là đã đọc.` });
    } catch (err) {
      console.error('[AdminNotification.bulkMarkAsRead]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/notifications/mark-all-read
   * Optional body: { user_id: number }
   */
  static async markAllAsRead(req, res) {
    try {
      const { user_id } = req.body ?? {};
      await AdminNotificationModel.markAllAsRead(user_id ?? null);
      return res.status(200).json({ success: true, message: 'Đã đánh dấu tất cả thông báo là đã đọc.' });
    } catch (err) {
      console.error('[AdminNotification.markAllAsRead]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi đánh dấu tất cả thông báo.' });
    }
  }

  /**
   * DELETE /api/admin/notifications/:id
   */
  static async remove(req, res) {
    try {
      await AdminNotificationModel.delete(req.params.id);
      return res.status(200).json({ success: true, message: 'Đã xóa thông báo.' });
    } catch (err) {
      console.error('[AdminNotification.remove]', err);
      const status = err.message.includes('tìm thấy') ? 404 : 400;
      return res.status(status).json({ success: false, message: err.message });
    }
  }

  /**
   * POST /api/admin/notifications/bulk-delete
   * Body: { ids: number[] }
   */
  static async bulkDelete(req, res) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ.' });
      }
      await AdminNotificationModel.bulkDelete(ids);
      return res.status(200).json({ success: true, message: `Đã xóa ${ids.length} thông báo.` });
    } catch (err) {
      console.error('[AdminNotification.bulkDelete]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = AdminNotificationController;
