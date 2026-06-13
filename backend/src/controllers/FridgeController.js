const FridgeItemModel = require('../models/FridgeItemModel');

const STORAGE_LOCATIONS = FridgeItemModel.getStorageLocations();

function getUserContext(req) {
  return {
    userId: req.user.id ?? req.user.user_id,
    // `authRequired` resolves the family group and exposes it as
    // `family_group_id` / `family_id`. Falling back to query/body keeps the
    // explicit-override behaviour the controller already supported.
    familyGroupId:
      req.user.family_group_id ||
      req.user.family_id ||
      req.user.familyGroupId ||
      req.query.familyGroupId ||
      req.body?.familyGroupId ||
      null,
  };
}

function isPastDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${dateStr}T00:00:00`);
  return expiry < today;
}

function validateCreateBody(body) {
  const errors = [];
  if (!body.name || !String(body.name).trim()) errors.push('Tên thực phẩm là bắt buộc');
  if (body.name && String(body.name).length > 255) errors.push('Tên thực phẩm tối đa 255 ký tự');
  if (body.quantity === undefined || body.quantity === null || Number(body.quantity) <= 0) {
    errors.push('Số lượng phải là số dương');
  }
  if (!body.unit || !String(body.unit).trim()) errors.push('Đơn vị là bắt buộc');
  if (!body.expiryDate) errors.push('Ngày hết hạn là bắt buộc');
  if (body.expiryDate && isPastDate(body.expiryDate)) {
    errors.push('Ngày hết hạn không được là ngày trong quá khứ');
  }
  if (!body.storageLocation || !STORAGE_LOCATIONS.includes(body.storageLocation)) {
    errors.push('Vị trí lưu trữ không hợp lệ');
  }
  return errors;
}

function validateUpdateBody(body) {
  const errors = [];
  if (body.name !== undefined && !String(body.name).trim()) errors.push('Tên thực phẩm không được rỗng');
  if (body.name && String(body.name).length > 255) errors.push('Tên thực phẩm tối đa 255 ký tự');
  if (body.quantity !== undefined && Number(body.quantity) <= 0) errors.push('Số lượng phải là số dương');
  if (body.unit !== undefined && !String(body.unit).trim()) errors.push('Đơn vị không được rỗng');
  if (body.expiryDate && isPastDate(body.expiryDate)) {
    errors.push('Ngày hết hạn không được là ngày trong quá khứ');
  }
  if (body.storageLocation !== undefined && !STORAGE_LOCATIONS.includes(body.storageLocation)) {
    errors.push('Vị trí lưu trữ không hợp lệ');
  }
  return errors;
}

class FridgeController {
  static async getStorageSuggestion(req, res) {
    try {
      const name = String(req.query.name || '').trim();
      const categoryName = String(req.query.categoryName || '').trim() || null;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Thiếu tên thực phẩm để gợi ý bảo quản' });
      }
      const suggestion = FridgeItemModel.suggestStorageLocation(name, categoryName);
      return res.status(200).json({
        success: true,
        data: { suggestion },
        message: 'Lấy gợi ý bảo quản thành công',
      });
    } catch (error) {
      console.error('[FridgeController.getStorageSuggestion]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy gợi ý bảo quản' });
    }
  }

  static async getItems(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      const data = await FridgeItemModel.findAll({
        userId,
        familyGroupId,
        filters: {
          search: req.query.search || null,
          categoryId: req.query.categoryId || null,
          storageLocation: req.query.storageLocation || null,
          expiringSoon: req.query.expiringSoon === 'true',
          sortBy: req.query.sortBy || 'expiryDate',
          sortOrder: req.query.sortOrder || 'asc',
        },
        pagination: {
          page: req.query.page,
          limit: req.query.limit,
        },
      });

      return res.status(200).json({
        success: true,
        data,
        message: 'Lấy danh sách tủ lạnh thành công',
      });
    } catch (error) {
      console.error('[FridgeController.getItems]', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server khi lấy danh sách tủ lạnh',
      });
    }
  }

  static async addItem(req, res) {
    try {
      const errors = validateCreateBody(req.body);
      if (errors.length) {
        return res.status(400).json({ success: false, message: errors.join('. ') });
      }

      const { userId, familyGroupId } = getUserContext(req);
      const item = await FridgeItemModel.create(
        {
          name: String(req.body.name).trim(),
          quantity: Number(req.body.quantity),
          unit: String(req.body.unit).trim(),
          expiryDate: req.body.expiryDate,
          storageLocation: req.body.storageLocation,
          categoryId: req.body.categoryId || null,
          notes: req.body.notes || null,
          familyGroupId: req.body.familyGroupId || familyGroupId,
        },
        userId,
      );

      return res.status(201).json({
        success: true,
        data: { item },
        message: 'Thêm thực phẩm thành công',
      });
    } catch (error) {
      console.error('[FridgeController.addItem]', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server khi thêm thực phẩm',
      });
    }
  }

  static async updateItem(req, res) {
    try {
      const errors = validateUpdateBody(req.body);
      if (errors.length) {
        return res.status(400).json({ success: false, message: errors.join('. ') });
      }

      const { userId, familyGroupId } = getUserContext(req);
      const existing = await FridgeItemModel.findById(req.params.id, userId, familyGroupId);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thực phẩm' });
      }

      const item = await FridgeItemModel.update(
        req.params.id,
        {
          name: req.body.name !== undefined ? String(req.body.name).trim() : undefined,
          quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : undefined,
          unit: req.body.unit !== undefined ? String(req.body.unit).trim() : undefined,
          expiryDate: req.body.expiryDate,
          storageLocation: req.body.storageLocation,
          categoryId: req.body.categoryId,
          notes: req.body.notes,
          familyGroupId: req.body.familyGroupId,
        },
        userId,
        familyGroupId,
      );

      return res.status(200).json({
        success: true,
        data: { item },
        message: 'Cập nhật thực phẩm thành công',
      });
    } catch (error) {
      console.error('[FridgeController.updateItem]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật thực phẩm' });
    }
  }

  static async deleteItem(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      const deleted = await FridgeItemModel.softDelete(req.params.id, userId, familyGroupId);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thực phẩm' });
      }
      return res.status(200).json({ success: true, message: 'Xóa thực phẩm thành công' });
    } catch (error) {
      console.error('[FridgeController.deleteItem]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi xóa thực phẩm' });
    }
  }

  static async bulkDelete(req, res) {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
      if (!ids.length) {
        return res.status(400).json({ success: false, message: 'Danh sách ids không hợp lệ' });
      }

      const { userId, familyGroupId } = getUserContext(req);
      const deletedCount = await FridgeItemModel.bulkSoftDelete(ids, userId, familyGroupId);

      return res.status(200).json({
        success: true,
        data: { deletedCount },
        message: `Đã xóa ${deletedCount} thực phẩm`,
      });
    } catch (error) {
      console.error('[FridgeController.bulkDelete]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi xóa hàng loạt' });
    }
  }

  static async updateQuantity(req, res) {
    try {
      const { quantityUsed, action } = req.body;
      if (!quantityUsed || Number(quantityUsed) <= 0) {
        return res.status(400).json({ success: false, message: 'Số lượng sử dụng phải lớn hơn 0' });
      }
      if (!['use', 'restock'].includes(action)) {
        return res.status(400).json({ success: false, message: 'action phải là use hoặc restock' });
      }

      const { userId, familyGroupId } = getUserContext(req);
      const item = await FridgeItemModel.updateQuantity(
        req.params.id,
        Number(quantityUsed),
        action,
        userId,
        familyGroupId,
      );

      if (!item) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thực phẩm' });
      }

      return res.status(200).json({
        success: true,
        data: { item },
        message: 'Cập nhật số lượng thành công',
      });
    } catch (error) {
      console.error('[FridgeController.updateQuantity]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật số lượng' });
    }
  }

  static async getExpiring(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      const items = await FridgeItemModel.findExpiring(userId, 3, familyGroupId);
      return res.status(200).json({
        success: true,
        data: { items },
        message: 'Lấy danh sách sắp hết hạn thành công',
      });
    } catch (error) {
      console.error('[FridgeController.getExpiring]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách sắp hết hạn' });
    }
  }

  static async exportCsv(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      const rows = await FridgeItemModel.findForExport(userId, familyGroupId);

      const header = 'Tên thực phẩm,Số lượng,Đơn vị,Hạn sử dụng,Danh mục,Vị trí lưu trữ,Ngày thêm';
      const lines = rows.map((row) => {
        const expiry = row.expiry_date instanceof Date
          ? `${row.expiry_date.getFullYear()}-${String(row.expiry_date.getMonth() + 1).padStart(2, '0')}-${String(row.expiry_date.getDate()).padStart(2, '0')}`
          : row.expiry_date;
        const created = row.created_at instanceof Date
          ? `${row.created_at.getFullYear()}-${String(row.created_at.getMonth() + 1).padStart(2, '0')}-${String(row.created_at.getDate()).padStart(2, '0')}`
          : row.created_at;
        const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        return [
          escape(row.name),
          escape(row.quantity),
          escape(row.unit),
          escape(expiry),
          escape(row.category_name),
          escape(row.storage_location),
          escape(created),
        ].join(',');
      });

      const csv = `\uFEFF${header}\n${lines.join('\n')}`;
      const filename = `tu_lanh_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    } catch (error) {
      console.error('[FridgeController.exportCsv]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi xuất CSV' });
    }
  }

  static async getAvailableIngredients(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      const ingredients = await FridgeItemModel.findAvailableIngredients(userId, familyGroupId);
      return res.status(200).json({
        success: true,
        data: { ingredients },
        message: 'Lấy nguyên liệu khả dụng thành công',
      });
    } catch (error) {
      console.error('[FridgeController.getAvailableIngredients]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy nguyên liệu' });
    }
  }
}

module.exports = FridgeController;
