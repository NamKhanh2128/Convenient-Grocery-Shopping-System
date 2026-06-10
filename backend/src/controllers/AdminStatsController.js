const AdminStatsModel = require('../models/AdminStatsModel');

class AdminStatsController {
  static async summary(req, res) {
    try {
      const data = await AdminStatsModel.summary();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('[AdminStats.summary]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thống kê tổng quan.' });
    }
  }

  static async mealsByDay(req, res) {
    try {
      const data = await AdminStatsModel.mealsByDay();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('[AdminStats.mealsByDay]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thống kê theo ngày.' });
    }
  }

  static async foodsByCategory(req, res) {
    try {
      const data = await AdminStatsModel.foodsByCategory();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('[AdminStats.foodsByCategory]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy phân bổ thực phẩm.' });
    }
  }

  static async topRecipes(req, res) {
    try {
      const data = await AdminStatsModel.topRecipes();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('[AdminStats.topRecipes]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy top công thức.' });
    }
  }

  static async getFamilies(req, res) {
    try {
      const data = await AdminStatsModel.getFamilies();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('[AdminStats.getFamilies]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách gia đình.' });
    }
  }
}

module.exports = AdminStatsController;
