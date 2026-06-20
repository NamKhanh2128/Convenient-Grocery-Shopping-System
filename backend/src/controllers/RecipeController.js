const RecipeModel = require('../models/RecipeModel');

function getUserContext(req) {
  return {
    userId: req.user?.user_id ?? req.user?.id ?? null,
    familyGroupId:
      req.query.familyGroupId
      || req.body?.familyGroupId
      || (req.user?.gia_dinh_id != null ? String(req.user.gia_dinh_id) : null)
      || (req.user?.family_id != null ? String(req.user.family_id) : null)
      || null,
  };
}

function validateCreateBody(body) {
  const errors = [];
  if (!body.tieu_de || !String(body.tieu_de).trim()) errors.push('Tiêu đề công thức là bắt buộc');
  if (!body.huong_dan || !String(body.huong_dan).trim()) errors.push('Hướng dẫn nấu là bắt buộc');
  if (body.loai_quyen === 'FAMILY' && !body.familyGroupId && !body.gia_dinh_id) {
    errors.push('Công thức FAMILY cần familyGroupId');
  }
  return errors;
}

class RecipeController {
  static async listPublic(req, res) {
    try {
      const lite = req.query.lite !== 'false' && req.query.includeIngredients !== 'true';
      const [recipes, categories] = await Promise.all([
        RecipeModel.findPublic({
          search: req.query.search || null,
          categoryId: req.query.categoryId || null,
          limit: Number(req.query.limit) || 50,
          offset: Number(req.query.offset) || 0,
          lite,
        }),
        RecipeModel.getCategories(),
      ]);
      return res.status(200).json({
        success: true,
        data: { recipes, categories },
        message: 'Lấy danh sách công thức công khai thành công',
      });
    } catch (error) {
      console.error('[RecipeController.listPublic]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy công thức công khai' });
    }
  }

  static async detailPublic(req, res) {
    try {
      const recipe = await RecipeModel.findPublicById(req.params.id);
      if (!recipe) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy công thức' });
      }
      return res.status(200).json({
        success: true,
        data: { recipe },
        message: 'Lấy chi tiết công thức thành công',
      });
    } catch (error) {
      console.error('[RecipeController.detailPublic]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết công thức' });
    }
  }

  static async list(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      const lite = req.query.lite !== 'false' && req.query.includeIngredients !== 'true';
      const [recipes, categories] = await Promise.all([
        RecipeModel.findAccessible({
          userId,
          familyGroupId,
          search: req.query.search || null,
          privacy: req.query.privacy || null,
          timeTag: req.query.timeTag || null,
          limit: Number(req.query.limit) || 100,
          offset: Number(req.query.offset) || 0,
          lite,
        }),
        RecipeModel.getCategories(),
      ]);
      return res.status(200).json({
        success: true,
        data: { recipes, categories },
        message: 'Lấy danh sách công thức thành công',
      });
    } catch (error) {
      console.error('[RecipeController.list]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách công thức' });
    }
  }

  static async detail(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      const recipe = await RecipeModel.findById({
        id: req.params.id,
        userId,
        familyGroupId,
      });
      if (!recipe) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy công thức hoặc không có quyền xem' });
      }
      return res.status(200).json({
        success: true,
        data: { recipe },
        message: 'Lấy chi tiết công thức thành công',
      });
    } catch (error) {
      console.error('[RecipeController.detail]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết công thức' });
    }
  }

  static async create(req, res) {
    try {
      const errors = validateCreateBody({ ...req.body, familyGroupId: getUserContext(req).familyGroupId });
      if (errors.length) {
        return res.status(400).json({ success: false, message: errors.join('; ') });
      }
      const { userId, familyGroupId } = getUserContext(req);
      const recipe = await RecipeModel.create({ userId, familyGroupId, data: req.body });
      if (!recipe) {
        return res.status(500).json({ success: false, message: 'Đã tạo công thức nhưng không đọc lại được dữ liệu.' });
      }
      return res.status(201).json({
        success: true,
        data: { recipe },
        message: 'Tạo công thức thành công',
      });
    } catch (error) {
      console.error('[RecipeController.create]', error);
      return res.status(400).json({ success: false, message: error.message || 'Không thể tạo công thức' });
    }
  }

  static async update(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      const recipe = await RecipeModel.update({
        id: req.params.id,
        userId,
        familyGroupId,
        data: req.body,
      });
      if (!recipe) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy công thức' });
      }
      return res.status(200).json({
        success: true,
        data: { recipe },
        message: 'Cập nhật công thức thành công',
      });
    } catch (error) {
      console.error('[RecipeController.update]', error);
      return res.status(400).json({ success: false, message: error.message || 'Không thể cập nhật công thức' });
    }
  }

  static async remove(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      const ok = await RecipeModel.remove({
        id: req.params.id,
        userId,
        familyGroupId,
      });
      if (!ok) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy công thức' });
      }
      return res.status(200).json({ success: true, data: null, message: 'Xóa công thức thành công' });
    } catch (error) {
      console.error('[RecipeController.remove]', error);
      return res.status(400).json({ success: false, message: error.message || 'Không thể xóa công thức' });
    }
  }

  static async popular(req, res) {
    try {
      const { userId } = getUserContext(req);
      if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });
      const recipes = await RecipeModel.getPopular({ userId, limit: Number(req.query.limit) || 5 });
      return res.status(200).json({ success: true, data: { recipes }, message: 'OK' });
    } catch (error) {
      console.error('[RecipeController.popular]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  static async suggestFromFridge(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      if (!familyGroupId) {
        return res.status(400).json({ success: false, message: 'Thiếu familyGroupId để gợi ý từ tủ lạnh' });
      }
      const suggestions = await RecipeModel.suggestFromFridge({
        userId,
        familyGroupId,
        limit: Number(req.query.limit) || 20,
      });
      return res.status(200).json({
        success: true,
        data: { suggestions },
        message: 'Gợi ý công thức từ tủ lạnh thành công',
      });
    } catch (error) {
      console.error('[RecipeController.suggestFromFridge]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi gợi ý công thức' });
    }
  }

  static async addFavorite(req, res) {
    try {
      const { userId } = getUserContext(req);
      await RecipeModel.addFavorite({ userId, recipeId: req.params.id });
      return res.status(200).json({ success: true, data: null, message: 'Đã thêm yêu thích' });
    } catch (error) {
      console.error('[RecipeController.addFavorite]', error);
      return res.status(500).json({ success: false, message: 'Không thể thêm yêu thích' });
    }
  }

  static async removeFavorite(req, res) {
    try {
      const { userId } = getUserContext(req);
      await RecipeModel.removeFavorite({ userId, recipeId: req.params.id });
      return res.status(200).json({ success: true, data: null, message: 'Đã bỏ yêu thích' });
    } catch (error) {
      console.error('[RecipeController.removeFavorite]', error);
      return res.status(500).json({ success: false, message: 'Không thể bỏ yêu thích' });
    }
  }

  static async listFavorites(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      const recipes = await RecipeModel.findFavorites({ userId, familyGroupId });
      return res.status(200).json({
        success: true,
        data: { recipes },
        message: 'Lấy công thức yêu thích thành công',
      });
    } catch (error) {
      console.error('[RecipeController.listFavorites]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy yêu thích' });
    }
  }

  static async getMissingIngredients(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      if (!familyGroupId) {
        return res.status(400).json({ success: false, message: 'Thiếu familyGroupId' });
      }
      const result = await RecipeModel.getMissingForRecipe({
        recipeId: req.params.id,
        userId,
        familyGroupId,
      });
      if (!result) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy công thức' });
      }
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Lấy nguyên liệu thiếu thành công',
      });
    } catch (error) {
      console.error('[RecipeController.getMissingIngredients]', error);
      return res.status(500).json({ success: false, message: 'Lỗi server khi lấy nguyên liệu thiếu' });
    }
  }

  static async markCooked(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      if (!familyGroupId) {
        return res.status(400).json({ success: false, message: 'Thiếu familyGroupId' });
      }
      const result = await RecipeModel.markCooked({
        recipeId: req.params.id,
        userId,
        familyGroupId,
      });
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Đã trừ nguyên liệu trong tủ lạnh sau khi nấu',
      });
    } catch (error) {
      console.error('[RecipeController.markCooked]', error);
      return res.status(400).json({ success: false, message: error.message || 'Không thể cập nhật tủ lạnh' });
    }
  }

  static async createShoppingList(req, res) {
    try {
      const { userId, familyGroupId } = getUserContext(req);
      if (!familyGroupId) {
        return res.status(400).json({ success: false, message: 'Thiếu familyGroupId' });
      }
      const result = await RecipeModel.createShoppingListFromRecipe({
        recipeId: req.params.id,
        userId,
        familyGroupId,
        title: req.body?.title,
      });
      return res.status(201).json({
        success: true,
        data: result,
        message: 'Đã tạo danh sách mua từ công thức',
      });
    } catch (error) {
      console.error('[RecipeController.createShoppingList]', error);
      const status = error.message.includes('Không') ? 400 : 500;
      return res.status(status).json({
        success: false,
        message: error.message || 'Lỗi server khi tạo danh sách mua',
      });
    }
  }
}

module.exports = RecipeController;
