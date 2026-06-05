const FoodModel = require('../models/FoodModel');

class FoodController {
  static async list(req, res) {
    try {
      const foods = await FoodModel.list({
        search: req.query.search || null,
        limit: req.query.limit,
      });
      return res.status(200).json({
        success: true,
        data: { foods },
        message: 'Lấy danh sách thực phẩm thành công',
      });
    } catch (error) {
      console.error('[FoodController.list]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thực phẩm' });
    }
  }
}

module.exports = FoodController;
