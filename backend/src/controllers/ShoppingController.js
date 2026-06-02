const ShoppingService = require('../services/ShoppingService');
const ShoppingModel = require('../models/ShoppingModel');
const { success, fail } = require('../utils/response');

class ShoppingController {
  async _familyId(req) {
    return req.user.family_id || (await ShoppingModel.getUserFamilyId(req.user.user_id));
  }

  async getLists(req, res) {
    try {
      const status = req.query.status || 'active';
      const familyId = await this._familyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      const lists = await ShoppingService.list(familyId, status);
      success(res, lists);
    } catch (err) {
      fail(res, err.message, 400);
    }
  }

  async getListDetail(req, res) {
    try {
      const familyId = await this._familyId(req);
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
      const familyId = await this._familyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      const result = await ShoppingService.createList({
        userId: req.user.user_id,
        familyId,
        ...req.body,
        shareMemberIds: req.body.share_member_ids || [],
      });
      success(res, result, 201);
    } catch (err) {
      fail(res, err.message, 400);
    }
  }

  async addItem(req, res) {
    try {
      const familyId = await this._familyId(req);
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
      const familyId = await this._familyId(req);
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
      const familyId = await this._familyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      const { bought_quantity } = req.body;
      if (bought_quantity === undefined) return fail(res, 'Vui lòng cung cấp bought_quantity.', 400);
      const result = await ShoppingService.recordPurchase(
        Number(req.params.listId),
        Number(req.params.itemId),
        Number(bought_quantity),
        familyId
      );
      success(res, result);
    } catch (err) {
      fail(res, err.message, 400);
    }
  }

  async completeList(req, res) {
    try {
      const familyId = await this._familyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      const result = await ShoppingService.completeList(req.params.listId, familyId);
      success(res, result);
    } catch (err) {
      fail(res, err.message, 400);
    }
  }

  async deleteList(req, res) {
    try {
      const familyId = await this._familyId(req);
      if (!familyId) return fail(res, 'Bạn chưa tham gia nhóm gia đình nào.', 403);
      await ShoppingService.deleteList(Number(req.params.listId));
      res.status(204).end();
    } catch (err) {
      const code = err.message.includes('quyền') ? 403 : 404;
      fail(res, err.message, code);
    }
  }
}

module.exports = new ShoppingController();
