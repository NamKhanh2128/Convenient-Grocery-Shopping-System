import ShoppingModel from '../models/ShoppingModel.js';

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

  async list(familyId, status = 'active') {
    const lists = await ShoppingModel.list(familyId, status);
    const result = [];
    for (const list of lists) {
      const items = await ShoppingModel.listItems(list.id);
      result.push({
        ...list,
        status: this._toFrontendStatus(list.status),
        items: items.map((item) => ({
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
        })),
      });
    }
    return result;
  }

  async getListDetail(listId, userFamilyId) {
    const list = await ShoppingModel.findById(listId);
    if (!list) throw new Error('Không tìm thấy danh sách mua sắm.');
    if (list.group_id !== userFamilyId) throw new Error('Bạn không có quyền truy cập danh sách này.');
    const items = await ShoppingModel.listItems(listId);
    return {
      ...list,
      status: this._toFrontendStatus(list.status),
      items: items.map((item) => ({
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
      })),
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
      let foodId = item.food_id ? Number(item.food_id) : null;
      if (!foodId && item.food_name) {
        const existing = await ShoppingModel.findFoodByName(item.food_name);
        if (existing) foodId = existing.id;
        else foodId = await ShoppingModel.insertFood({
          foodName: item.food_name,
          unitId: Number(item.unit_id),
          categoryId: Number(item.category_id),
        });
      }
      if (!foodId) throw new Error(`Mặt hàng "${item.food_name || item.food_id}" không hợp lệ.`);
      await ShoppingModel.insertItem({
        shoppingListId: listId,
        foodId,
        name: item.food_name,
        quantity: Number(item.quantity),
        unitId: Number(item.unit_id),
        categoryId: Number(item.category_id),
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

  async addItem(listId, userFamilyId, { food_id, food_name, quantity, unit_id, category_id }) {
    const list = await ShoppingModel.findById(listId);
    if (!list) throw new Error('Không tìm thấy danh sách.');
    if (list.group_id !== userFamilyId) throw new Error('Bạn không có quyền chỉnh sửa danh sách này.');

    let foodId = food_id ? Number(food_id) : null;
    if (!foodId && food_name) {
      const existing = await ShoppingModel.findFoodByName(food_name);
      if (existing) foodId = existing.id;
      else foodId = await ShoppingModel.insertFood({
        foodName: food_name,
        unitId: Number(unit_id),
        categoryId: Number(category_id),
      });
    }
    if (!foodId) throw new Error('Vui lòng cung cấp food_id hoặc food_name để thêm mặt hàng.');

    await ShoppingModel.insertItem({
      shoppingListId: listId,
      foodId,
      name: food_name,
      quantity: Number(quantity),
      unitId: Number(unit_id),
      categoryId: Number(category_id),
    });

    return this.getListDetail(listId, userFamilyId);
  }

  async deleteItems(listId, itemIds, userFamilyId) {
    const list = await ShoppingModel.findById(listId);
    if (!list) throw new Error('Không tìm thấy danh sách.');
    if (list.group_id !== userFamilyId) throw new Error('Bạn không có quyền xóa mặt hàng trong danh sách này.');
    if (!itemIds.length) throw new Error('Chưa chọn mặt hàng để xóa.');
    await ShoppingModel.deleteItems(listId, itemIds.map((id) => Number(id)));
  }

  async recordPurchase(listId, itemId, boughtQuantity, userFamilyId) {
    if (!Number.isFinite(boughtQuantity) || boughtQuantity < 0) {
      throw new Error('Số lượng mua phải là số không âm.');
    }

    const list = await ShoppingModel.findById(listId);
    if (!list) throw new Error('Không tìm thấy danh sách.');
    if (list.group_id !== userFamilyId) throw new Error('Bạn không có quyền cập nhật danh sách này.');

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
        foodId: item.food_id,
        quantity: delta,
      });
    }

    const itemStatus = this._resolveStatus(required, boughtQuantity);
    const remaining = Math.max(0, required - boughtQuantity);
    const isPurchased = boughtQuantity >= required;

    await ShoppingModel.updateItemPurchased(
      Number(itemId),
      boughtQuantity,
      remaining,
      itemStatus,
      isPurchased
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
    if (list.group_id !== userFamilyId) throw new Error('Bạn không có quyền hoàn tất danh sách này.');

    const items = await ShoppingModel.listItems(listId);
    const allCompleted = items.every((i) => i.item_status === 'COMPLETED');
    if (!allCompleted) {
      throw new Error('Danh sách chỉ hoàn tất khi tất cả mặt hàng đã được mua.');
    }

    await ShoppingModel.updateListStatus(listId, 'completed');
    const fresh = await this.getListDetail(listId, userFamilyId);
    return fresh;
  }

  async deleteList(listId) {
    await ShoppingModel.deleteList(listId);
  }
}

export default new ShoppingService();
