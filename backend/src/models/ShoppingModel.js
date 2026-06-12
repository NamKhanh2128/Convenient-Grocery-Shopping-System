const { query: dbQuery } = require('../config/db');
const FridgeItemModel = require('./FridgeItemModel');

class ShoppingModel {
  async list(familyId, status = 'active') {
    const { rows } = await dbQuery(
      `SELECT sl.id, sl.user_id, sl.group_id, sl.list_type, sl.name, sl.plan_date, sl.status,
              sl.assigned_user_id, sl.created_at, sl.updated_at
       FROM shopping_lists sl
       WHERE sl.group_id = $1
       ${status !== 'all' ? 'AND sl.status = $2' : ''}
       ORDER BY sl.created_at DESC`,
      status !== 'all' ? [familyId, status] : [familyId]
    );
    return rows;
  }

  async findById(listId) {
    const { rows } = await dbQuery(
      `SELECT sl.id, sl.user_id, sl.group_id, sl.list_type, sl.name, sl.plan_date, sl.status,
              sl.assigned_user_id, sl.created_at, sl.updated_at
       FROM shopping_lists sl
       WHERE sl.id = $1`,
      [listId]
    );
    return rows[0] || null;
  }

  async insertList({ userId, groupId, listType, name, planDate, assignedUserId }) {
    const { rows } = await dbQuery(
      `INSERT INTO shopping_lists (user_id, group_id, list_type, name, plan_date, status, assigned_user_id)
       VALUES ($1, $2, $3, $4, $5, 'active', $6)
       RETURNING id`,
      [userId, groupId, listType, name, planDate || null, assignedUserId || null]
    );
    return rows[0].id;
  }

  async updateListStatus(listId, status) {
    await dbQuery(
      `UPDATE shopping_lists SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, listId]
    );
  }

  async deleteList(listId) {
    await dbQuery(`DELETE FROM shopping_list_items WHERE shopping_list_id = $1`, [listId]);
    await dbQuery(`DELETE FROM shopping_lists WHERE id = $1`, [listId]);
  }

  async listItems(listId) {
    const { rows } = await dbQuery(
      `SELECT sli.id, sli.shopping_list_id, sli.food_id, sli.name, sli.quantity,
              sli.unit_id, sli.category_id, sli.is_purchased, sli.purchased_by, sli.purchased_at,
              sli.bought_quantity, sli.remaining_quantity, sli.item_status,
              sli.inventory_synced_quantity, sli.bought_status, sli.created_at,
              f.food_name AS food_name, f.icon AS food_icon,
              u.symbol AS unit_symbol, u.name AS unit_name,
              fc.name_vi AS category_name_vi, fc.name_en AS category_name_en
       FROM shopping_list_items sli
       LEFT JOIN foods f ON sli.food_id = f.id
       LEFT JOIN units u ON COALESCE(f.unit_id, sli.unit_id) = u.id
       LEFT JOIN food_categories fc ON COALESCE(f.category_id, sli.category_id) = fc.id
       WHERE sli.shopping_list_id = $1
       ORDER BY sli.created_at ASC`,
      [listId]
    );
    return rows;
  }

  async listItemsForLists(listIds) {
    if (!listIds.length) return [];
    const { rows } = await dbQuery(
      `SELECT sli.id, sli.shopping_list_id, sli.food_id, sli.name, sli.quantity,
              sli.unit_id, sli.category_id, sli.is_purchased, sli.purchased_by, sli.purchased_at,
              sli.bought_quantity, sli.remaining_quantity, sli.item_status,
              sli.inventory_synced_quantity, sli.bought_status, sli.created_at,
              f.food_name AS food_name, f.icon AS food_icon,
              u.symbol AS unit_symbol, u.name AS unit_name,
              fc.name_vi AS category_name_vi, fc.name_en AS category_name_en
       FROM shopping_list_items sli
       LEFT JOIN foods f ON sli.food_id = f.id
       LEFT JOIN units u ON COALESCE(f.unit_id, sli.unit_id) = u.id
       LEFT JOIN food_categories fc ON COALESCE(f.category_id, sli.category_id) = fc.id
       WHERE sli.shopping_list_id = ANY($1::int[])
       ORDER BY sli.shopping_list_id, sli.created_at ASC`,
      [listIds],
    );
    return rows;
  }

  async insertItem({ shoppingListId, foodId, name, quantity, unitId, categoryId, boughtQuantity = 0, itemStatus = 'PENDING' }) {
    const safeName = String(name || '').trim() || `Mặt hàng #${foodId}`;
    const { rows } = await dbQuery(
      `INSERT INTO shopping_list_items
       (shopping_list_id, food_id, name, quantity, unit_id, category_id,
        bought_quantity, remaining_quantity, item_status, is_purchased)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        shoppingListId,
        foodId,
        safeName,
        quantity,
        unitId,
        categoryId,
        boughtQuantity,
        quantity,
        itemStatus,
        itemStatus === 'COMPLETED',
      ]
    );
    return rows[0].id;
  }

  async updateItemPurchased(itemId, boughtQuantity, remainingQuantity, itemStatus, isPurchased, inventorySyncedQuantity) {
    await dbQuery(
      `UPDATE shopping_list_items
       SET bought_quantity = $1, remaining_quantity = $2, item_status = $3, is_purchased = $4,
           bought_status = $4,
           inventory_synced_quantity = $5,
           purchased_at = CASE WHEN $6 = TRUE THEN NOW() ELSE purchased_at END
       WHERE id = $7`,
      [boughtQuantity, remainingQuantity, itemStatus, isPurchased, inventorySyncedQuantity, isPurchased, itemId]
    );
  }

  async deleteItems(listId, itemIds) {
    const placeholders = itemIds.map((_, i) => `$${i + 2}`).join(',');
    await dbQuery(
      `DELETE FROM shopping_list_items WHERE shopping_list_id = $1 AND id IN (${placeholders})`,
      [listId, ...itemIds]
    );
  }

  async updateItemQuantity(itemId, quantity) {
    await dbQuery(
      `UPDATE shopping_list_items
       SET quantity    = $1,
           remaining_quantity = GREATEST($1 - COALESCE(bought_quantity, 0), 0),
           item_status = CASE
             WHEN COALESCE(bought_quantity, 0) >= $1 THEN 'COMPLETED'
             WHEN COALESCE(bought_quantity, 0) > 0   THEN 'PARTIAL'
             ELSE 'PENDING'
           END,
           is_purchased  = (COALESCE(bought_quantity, 0) >= $1),
           bought_status = (COALESCE(bought_quantity, 0) >= $1)
       WHERE id = $2`,
      [quantity, itemId]
    );
  }

  async countCompleted(listId) {
    const { rows } = await dbQuery(
      `SELECT COUNT(*) AS completed, SUM(quantity) AS total
       FROM shopping_list_items
       WHERE shopping_list_id = $1 AND item_status = 'COMPLETED'`,
      [listId]
    );
    return rows[0];
  }

  async findFoodByName(name) {
    const { rows } = await dbQuery(
      `SELECT id, food_name, unit_id, category_id, icon FROM foods WHERE food_name = $1`,
      [name]
    );
    return rows[0] || null;
  }

  async findFoodById(foodId) {
    const { rows } = await dbQuery(
      `SELECT id, food_name, unit_id, category_id, icon FROM foods WHERE id = $1`,
      [Number(foodId)],
    );
    return rows[0] || null;
  }

  async insertFood({ foodName, unitId, categoryId, icon = '🧺' }) {
    const { rows } = await dbQuery(
      `INSERT INTO foods (food_name, unit_id, category_id, icon) VALUES ($1, $2, $3, $4) RETURNING id`,
      [foodName, unitId, categoryId, icon]
    );
    return rows[0].id;
  }

  async getUserFamilyId(userId) {
    const { rows } = await dbQuery(
      `SELECT gm.group_id FROM group_members gm WHERE gm.user_id = $1 LIMIT 1`,
      [userId]
    );
    return rows[0]?.group_id || null;
  }

  async getGroupMembers(groupId, excludeUserId) {
    const { rows } = await dbQuery(
      `SELECT user_id FROM group_members WHERE group_id = $1 AND user_id != $2`,
      [groupId, excludeUserId]
    );
    return rows.map((r) => r.user_id);
  }

  async insertInventoryEntry({ familyId, userId, foodId, foodName, quantity, unitSymbol }) {
    const { rows: foodRows } = foodId
      ? await dbQuery(
          `SELECT f.food_name, u.name AS unit_name
           FROM foods f
           LEFT JOIN units u ON f.unit_id = u.id
           WHERE f.id = $1`,
          [foodId],
        )
      : { rows: [] };
    const food = foodRows[0];
    const name = food?.food_name || foodName || 'Mặt hàng mua';
    const unit = food?.unit_name || unitSymbol || 'g';
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    // Use local Y/M/D parts so the date isn't rolled back a day in timezones
    // ahead of UTC (toISOString converts to UTC).
    const expiryDate = `${expiry.getFullYear()}-${String(expiry.getMonth() + 1).padStart(2, '0')}-${String(expiry.getDate()).padStart(2, '0')}`;

    await FridgeItemModel.create(
      {
        familyGroupId: String(familyId),
        name,
        quantity: Number(quantity) || 1,
        unit,
        expiryDate,
        storageLocation: 'Ngăn mát',
      },
      userId,
    );
  }

  async insertNotification(userId, type, title, message, relatedId = null) {
    const { rows } = await dbQuery(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, type, title, message, relatedId]
    );
    return rows[0].id;
  }
}

module.exports = new ShoppingModel();
