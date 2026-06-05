const ShoppingModel = require('../models/ShoppingModel');
const bridge = require('../utils/shoppingBridge');

class ShoppingService {
  _toFrontendStatus(dbStatus) {
    const map = { active: 'DRAFT', completed: 'DONE', cancelled: 'CANCELLED' };
    return map[dbStatus] || dbStatus;
  }

  _resolveStatus(required, bought) {
    if (bought >= required) return 'COMPLETED';
    if (bought > 0) return 'PARTIAL';
    return 'PENDING';
  }

  async _resolveItemDisplayName(item, foodId) {
    const direct = String(item.food_name || item.name || '').trim();
    if (direct) return direct;
    if (foodId) {
      const food = await ShoppingModel.findFoodById(foodId);
      if (food?.food_name) return food.food_name;
    }
    return foodId ? `Mặt hàng #${foodId}` : 'Nguyên liệu';
  }

  async _resolveItemIds(item) {
    let unitId = item.unit_id ? Number(item.unit_id) : null;
    if (!unitId && item.unit) {
      unitId = await bridge.getDefaultUnitId(item.unit);
    }
    if (!unitId) unitId = await bridge.getDefaultUnitId('g');

    let categoryId = item.category_id ? Number(item.category_id) : null;
    if (!categoryId) categoryId = await bridge.getDefaultCategoryId();

    return { unitId, categoryId };
  }

  _mapListItem(item) {
    return {
      id: String(item.id),
      shopping_list_id: String(item.shopping_list_id),
      food_id: item.food_id != null ? String(item.food_id) : null,
      name: item.name,
      quantity: Number(item.quantity),
      unit_id: String(item.unit_id),
      unit_name: item.unit_name || item.unit_symbol || '',
      unit_symbol: item.unit_symbol || item.unit_name || '',
      category_id: String(item.category_id),
      category_name_vi: item.category_name_vi || '',
      category_name_en: item.category_name_en || '',
      is_purchased: Boolean(item.is_purchased),
      purchased_by: item.purchased_by != null ? String(item.purchased_by) : null,
      purchased_at: item.purchased_at,
      bought_quantity: Number(item.bought_quantity || 0),
      remaining_quantity: Number(item.remaining_quantity || item.quantity),
      item_status: item.item_status || 'PENDING',
      inventory_synced_quantity: Number(item.inventory_synced_quantity || 0),
      bought_status: Boolean(item.bought_status),
      food: item.food_id
        ? {
            food_id: String(item.food_id),
            food_name: item.food_name || item.name,
            icon: item.food_icon || '🧺',
            category: item.category_name_vi || '',
            unit: item.unit_symbol || '',
          }
        : null,
      created_at: item.created_at,
    };
  }

  async list(familyId, status = 'active') {
    const lists = await ShoppingModel.list(familyId, status);
    const listIds = lists.map((list) => list.id);
    const allItems = await ShoppingModel.listItemsForLists(listIds);
    const itemsByList = new Map();
    for (const item of allItems) {
      const key = String(item.shopping_list_id);
      if (!itemsByList.has(key)) itemsByList.set(key, []);
      itemsByList.get(key).push(item);
    }
    const result = [];
    for (const list of lists) {
      const items = itemsByList.get(String(list.id)) || [];
      result.push({
        ...list,
        status: this._toFrontendStatus(list.status),
        items: items.map((item) => this._mapListItem(item)),
      });
    }
    return result;
  }

  async getListDetail(listId, userFamilyId) {
    const list = await ShoppingModel.findById(listId);
    if (!list) throw new Error('Không tìm thấy danh sách mua sắm.');
    if (Number(list.group_id) !== Number(userFamilyId)) {
      throw new Error('Bạn không có quyền truy cập danh sách này.');
    }
    const items = await ShoppingModel.listItems(listId);
    return {
      ...list,
      status: this._toFrontendStatus(list.status),
      items: items.map((item) => this._mapListItem(item)),
    };
  }

  async createList({
    userId, familyId, name, listType, planDate, items, shareMemberIds = [], assignedUserId,
  }) {
    if (!name || !listType) throw new Error('Vui lòng nhập tên và kiểu danh sách.');
    if (!items || items.length === 0) throw new Error('Danh sách cần ít nhất 1 sản phẩm.');

    const listId = await ShoppingModel.insertList({
      userId,
      groupId: familyId,
      listType,
      name,
      planDate,
      assignedUserId: assignedUserId || null,
    });

    for (const item of items) {
      const { unitId, categoryId } = await this._resolveItemIds(item);
      let foodId = item.food_id ? Number(item.food_id) : null;
      if (!foodId && item.food_name) {
        const existing = await ShoppingModel.findFoodByName(item.food_name);
        if (existing) foodId = existing.id;
        else foodId = await ShoppingModel.insertFood({
          foodName: item.food_name,
          unitId,
          categoryId,
        });
      }
      if (!foodId) throw new Error(`Mặt hàng "${item.food_name || item.food_id}" không hợp lệ.`);
      const itemName = await this._resolveItemDisplayName(item, foodId);
      await ShoppingModel.insertItem({
        shoppingListId: listId,
        foodId,
        name: itemName,
        quantity: Number(item.quantity),
        unitId,
        categoryId,
      });
    }

    if (shareMemberIds.length > 0) {
      const members = await ShoppingModel.getGroupMembers(familyId, userId);
      for (const memberId of members) {
        if (shareMemberIds.includes(String(memberId))) {
          await ShoppingModel.insertNotification(
            memberId,
            'shopping_update',
            `Danh sách mua sắm mới: ${name}`,
            `${name} đã được tạo và chia sẻ cho bạn.`,
            listId
          );
        }
      }
    }

    const detail = await this.getListDetail(listId, familyId);
    return { ...detail, id: String(detail.id), shopping_list_id: String(listId) };
  }

  async addItem(listId, userFamilyId, { food_id, food_name, quantity, unit_id, category_id, unit }) {
    const list = await ShoppingModel.findById(listId);
    if (!list) throw new Error('Không tìm thấy danh sách.');
    if (Number(list.group_id) !== Number(userFamilyId)) {
      throw new Error('Bạn không có quyền chỉnh sửa danh sách này.');
    }

    const { unitId, categoryId } = await this._resolveItemIds({ unit_id, category_id, unit });
    let foodId = food_id ? Number(food_id) : null;
    if (!foodId && food_name) {
      const existing = await ShoppingModel.findFoodByName(food_name);
      if (existing) foodId = existing.id;
      else foodId = await ShoppingModel.insertFood({
        foodName: food_name,
        unitId,
        categoryId,
      });
    }
    if (!foodId) throw new Error('Vui lòng cung cấp food_id hoặc food_name để thêm mặt hàng.');

    const itemName = await this._resolveItemDisplayName({ food_name, name: food_name }, foodId);
    const itemId = await ShoppingModel.insertItem({
      shoppingListId: listId,
      foodId,
      name: itemName,
      quantity: Number(quantity),
      unitId,
      categoryId,
    });

    const detail = await this.getListDetail(listId, userFamilyId);
    const created = detail.items.find((i) => String(i.id) === String(itemId));
    return created || detail;
  }

  async deleteItems(listId, itemIds, userFamilyId) {
    const list = await ShoppingModel.findById(listId);
    if (!list) throw new Error('Không tìm thấy danh sách.');
    if (Number(list.group_id) !== Number(userFamilyId)) {
      throw new Error('Bạn không có quyền xóa mặt hàng trong danh sách này.');
    }
    if (!itemIds.length) throw new Error('Chưa chọn mặt hàng để xóa.');
    await ShoppingModel.deleteItems(listId, itemIds.map((id) => Number(id)));
  }

  async recordPurchase(listId, itemId, boughtQuantity, userFamilyId, userId) {
    if (!Number.isFinite(boughtQuantity) || boughtQuantity < 0) {
      throw new Error('Số lượng mua phải là số không âm.');
    }

    const list = await ShoppingModel.findById(listId);
    if (!list) throw new Error('Không tìm thấy danh sách.');
    if (Number(list.group_id) !== Number(userFamilyId)) {
      throw new Error('Bạn không có quyền cập nhật danh sách này.');
    }

    const items = await ShoppingModel.listItems(listId);
    const item = items.find((i) => i.id === Number(itemId));
    if (!item) throw new Error('Không tìm thấy mặt hàng.');

    const required = Number(item.quantity);
    const previousSynced = Number(item.inventory_synced_quantity || 0);

    if (boughtQuantity < previousSynced) {
      throw new Error(
        'Không thể giảm số lượng đã cập nhật vào tủ lạnh. Hãy tạo điều chỉnh trong tủ lạnh nếu cần.'
      );
    }

    const delta = Math.max(0, boughtQuantity - previousSynced);
    if (delta > 0) {
      await ShoppingModel.insertInventoryEntry({
        familyId: userFamilyId,
        userId,
        foodId: item.food_id,
        foodName: item.food_name || item.name,
        quantity: delta,
        unitSymbol: item.unit_symbol || item.unit_name,
      });
    }

    const itemStatus = this._resolveStatus(required, boughtQuantity);
    const remaining = Math.max(0, required - boughtQuantity);
    const isPurchased = boughtQuantity >= required;
    const inventorySyncedQuantity = previousSynced + delta;

    await ShoppingModel.updateItemPurchased(
      Number(itemId),
      boughtQuantity,
      remaining,
      itemStatus,
      isPurchased,
      inventorySyncedQuantity,
    );

    const updatedItems = await ShoppingModel.listItems(listId);
    const allDone = updatedItems.every((i) => i.item_status === 'COMPLETED');
    if (allDone && list.status !== 'completed') {
      await ShoppingModel.updateListStatus(listId, 'completed');
      const members = await ShoppingModel.getGroupMembers(userFamilyId, list.user_id);
      for (const memberId of members) {
        await ShoppingModel.insertNotification(
          memberId,
          'shopping_update',
          'Danh sách mua sắm đã hoàn tất',
          `Danh sách "${list.name}" đã mua đủ tất cả mặt hàng.`,
          listId
        );
      }
    }

    const fresh = await this.getListDetail(listId, userFamilyId);
    const updated = fresh.items.find((i) => String(i.id) === String(itemId));
    return { list: fresh, item: updated };
  }

  async completeList(listId, userFamilyId) {
    const list = await ShoppingModel.findById(listId);
    if (!list) throw new Error('Không tìm thấy danh sách.');
    if (Number(list.group_id) !== Number(userFamilyId)) {
      throw new Error('Bạn không có quyền hoàn tất danh sách này.');
    }

    const items = await ShoppingModel.listItems(listId);
    const allCompleted = items.every((i) => i.item_status === 'COMPLETED');
    if (!allCompleted) {
      throw new Error('Danh sách chỉ hoàn tất khi tất cả mặt hàng đã được mua.');
    }

    await ShoppingModel.updateListStatus(listId, 'completed');
    const fresh = await this.getListDetail(listId, userFamilyId);
    return fresh;
  }

  async deleteList(listId, userFamilyId) {
    const list = await ShoppingModel.findById(listId);
    if (!list) throw new Error('Không tìm thấy danh sách mua sắm.');
    if (Number(list.group_id) !== Number(userFamilyId)) {
      throw new Error('Bạn không có quyền xóa danh sách này.');
    }
    await ShoppingModel.deleteList(listId);
  }
}

module.exports = new ShoppingService();
