const ShoppingService = require('../services/ShoppingService');
const ShoppingModel = require('../models/ShoppingModel');
const bridge = require('../utils/shoppingBridge');
const { success, fail } = require('../utils/response');

async function resolveFamilyId(req) {
  const hint =
    req.query?.familyGroupId
    || req.query?.family_id
    || req.body?.familyGroupId
    || req.body?.family_id;
  if (hint) {
    return bridge.resolveShoppingGroupId(hint);
  }
  if (req.user?.family_id != null) {
    return bridge.resolveShoppingGroupId(req.user.family_id);
  }
  return ShoppingModel.getUserFamilyId(req.user.user_id);
}

class ShoppingController {
  async getLists(req, res) {
    try {
      const status = req.query.status || 'active';
      const familyId = await resolveFamilyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      const lists = await ShoppingService.list(familyId, status);
      success(res, lists);
    } catch (err) {
      fail(res, err.message, 400);
    }
  }

  async getListDetail(req, res) {
    try {
      const familyId = await resolveFamilyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      const list = await ShoppingService.getListDetail(req.params.listId, familyId);
      success(res, list);
    } catch (err) {
      const code = err.message.includes('quyền') ? 403 : 404;
      fail(res, err.message, code);
    }
  }

  async createList(req, res) {
    try {
      const familyId = await resolveFamilyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      const result = await ShoppingService.createList({
        userId: req.user.user_id,
        familyId,
        name: req.body.name,
        listType: req.body.list_type || req.body.listType,
        planDate: req.body.plan_date || req.body.planDate,
        items: req.body.items || [],
        assignedUserId: req.body.assigned_user_id || req.body.assignedUserId,
        shareMemberIds: req.body.share_member_ids || req.body.shareMemberIds || [],
      });
      success(res, result, 201);
    } catch (err) {
      fail(res, err.message, 400);
    }
  }

  async addItem(req, res) {
    try {
      const familyId = await resolveFamilyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      const result = await ShoppingService.addItem(
        Number(req.params.listId),
        familyId,
        req.body
      );
      success(res, result);
    } catch (err) {
      fail(res, err.message, 400);
    }
  }

  async deleteItems(req, res) {
    try {
      const familyId = await resolveFamilyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      await ShoppingService.deleteItems(
        Number(req.params.listId),
        req.body.item_ids || [],
        familyId
      );
      res.status(204).end();
    } catch (err) {
      fail(res, err.message, 400);
    }
  }

  async recordPurchase(req, res) {
    try {
      const familyId = await resolveFamilyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      const { bought_quantity } = req.body;
      if (bought_quantity === undefined) return fail(res, 'Vui lòng cung cấp bought_quantity.', 400);
      const result = await ShoppingService.recordPurchase(
        Number(req.params.listId),
        Number(req.params.itemId),
        Number(bought_quantity),
        familyId,
        req.user.user_id,
      );
      success(res, result);
    } catch (err) {
      fail(res, err.message, 400);
    }
  }

  async completeList(req, res) {
    try {
      const familyId = await resolveFamilyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      const result = await ShoppingService.completeList(req.params.listId, familyId);
      success(res, result);
    } catch (err) {
      fail(res, err.message, 400);
    }
  }

  async deleteList(req, res) {
    try {
      const familyId = await resolveFamilyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      await ShoppingService.deleteList(Number(req.params.listId), familyId);
      res.status(204).end();
    } catch (err) {
      const code = err.message.includes('quyền') ? 403 : 404;
      fail(res, err.message, code);
    }
  }
}

module.exports = new ShoppingController();
