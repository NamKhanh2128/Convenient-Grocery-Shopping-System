const StatsModel = require('../models/StatsModel');

function getFamilyId(req) {
  return (
    req.query.familyGroupId ||
    req.body?.familyGroupId ||
    (req.user?.gia_dinh_id != null ? String(req.user.gia_dinh_id) : null) ||
    (req.user?.family_id != null ? String(req.user.family_id) : null) ||
    null
  );
}

class StatsController {
  static async overview(req, res) {
    try {
      const familyId = getFamilyId(req);
      if (!familyId) return res.status(400).json({ success: false, message: 'Thiếu familyGroupId' });
      const data = await StatsModel.getOverview(familyId);
      return res.status(200).json({ success: true, data, message: 'OK' });
    } catch (err) {
      console.error('[StatsController.overview]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  static async dailyActivity(req, res) {
    try {
      const familyId = getFamilyId(req);
      if (!familyId) return res.status(400).json({ success: false, message: 'Thiếu familyGroupId' });
      const data = await StatsModel.getDailyActivity(familyId);
      return res.status(200).json({ success: true, data, message: 'OK' });
    } catch (err) {
      console.error('[StatsController.dailyActivity]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  static async categoryBar(req, res) {
    try {
      const familyId = getFamilyId(req);
      if (!familyId) return res.status(400).json({ success: false, message: 'Thiếu familyGroupId' });
      const data = await StatsModel.getCategoryBar(familyId);
      return res.status(200).json({ success: true, data, message: 'OK' });
    } catch (err) {
      console.error('[StatsController.categoryBar]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  static async foodTrends(req, res) {
    try {
      const familyId = getFamilyId(req);
      if (!familyId) return res.status(400).json({ success: false, message: 'Thiếu familyGroupId' });
      const data = await StatsModel.getFoodTrends(familyId);
      return res.status(200).json({ success: true, data, message: 'OK' });
    } catch (err) {
      console.error('[StatsController.foodTrends]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  static async wasteReport(req, res) {
    try {
      const familyId = getFamilyId(req);
      if (!familyId) return res.status(400).json({ success: false, message: 'Thiếu familyGroupId' });
      const data = await StatsModel.getWasteReport(familyId);
      return res.status(200).json({ success: true, data, message: 'OK' });
    } catch (err) {
      console.error('[StatsController.wasteReport]', err);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = StatsController;
