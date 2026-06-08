const MealPlanModel = require('../models/MealPlanModel');

class MealPlanController {
  // 5.1 Create Meal Plan
  static async createPlan(req, res) {
    try {
      const userId = req.user.id;
      const data = req.body;

      if (!data.plan_type || !data.start_date || !data.end_date) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thiếu thông tin bắt buộc (plan_type, start_date, end_date)' 
        });
      }

      // Check items array
      if (data.items && !Array.isArray(data.items)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Định dạng items không hợp lệ' 
        });
      }

      const plan = await MealPlanModel.createPlan(userId, data);
      
      return res.status(201).json({
        success: true,
        message: 'Tạo kế hoạch bữa ăn thành công',
        data: plan
      });
    } catch (error) {
      console.error('[MealPlanController.createPlan]', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi server khi tạo kế hoạch bữa ăn',
        error: error.message
      });
    }
  }

  // 5.2 Get Meal Plans
  static async getPlans(req, res) {
    try {
      const userId = req.user.id;
      const { start_date, end_date } = req.query;

      const plans = await MealPlanModel.getPlans(userId, start_date, end_date);
      
      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách kế hoạch bữa ăn thành công',
        data: plans
      });
    } catch (error) {
      console.error('[MealPlanController.getPlans]', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi server khi lấy kế hoạch bữa ăn' 
      });
    }
  }

  // 5.3 Get Meal Plan Detail
  static async getPlanDetail(req, res) {
    try {
      const userId = req.user.id;
      const { planId } = req.params;

      const plan = await MealPlanModel.getPlanById(planId, userId);
      
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy kế hoạch bữa ăn'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết kế hoạch bữa ăn thành công',
        data: plan
      });
    } catch (error) {
      console.error('[MealPlanController.getPlanDetail]', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi server khi lấy chi tiết kế hoạch bữa ăn' 
      });
    }
  }

  // 5.4 Mark Meal as Cooked
  static async markItemCooked(req, res) {
    try {
      const userId = req.user.id;
      const { planId, itemId } = req.params;
      // Accept either is_cooked or just true if absent, default to true
      const isCooked = req.body.is_cooked !== undefined ? req.body.is_cooked : true;

      const updatedItem = await MealPlanModel.markItemCooked(planId, itemId, isCooked, userId);
      
      if (!updatedItem) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy món ăn trong kế hoạch hoặc không có quyền truy cập'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái nấu ăn thành công',
        data: updatedItem
      });
    } catch (error) {
      console.error('[MealPlanController.markItemCooked]', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi server khi cập nhật trạng thái nấu ăn' 
      });
    }
  }

  // Extra: Delete Plan
  static async deletePlan(req, res) {
    try {
      const userId = req.user.id;
      const { planId } = req.params;

      const success = await MealPlanModel.deletePlan(planId, userId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy kế hoạch bữa ăn hoặc không có quyền xóa'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Xóa kế hoạch bữa ăn thành công'
      });
    } catch (error) {
      console.error('[MealPlanController.deletePlan]', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi server khi xóa kế hoạch bữa ăn' 
      });
    }
  }
}

module.exports = MealPlanController;
