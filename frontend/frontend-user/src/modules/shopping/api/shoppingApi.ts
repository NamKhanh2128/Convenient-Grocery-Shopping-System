import { endpoints } from "@/shared/constants/endpoints";
import type { Food, FoodCategory, FoodUnit, ShoppingItemStatus, ShoppingList, ShoppingListItem, ShoppingType } from "@/types";
import { addActivity, addInventory, db, getSession, saveDb } from "@/shared/lib/mockDb";
import { uid } from "@/shared/utils/storage";

export type ShoppingListDetail = ShoppingList & { items: Array<ShoppingListItem & { food: Food }> };
export type ShoppingCreateItem =
  | { food_id: string; quantity: number }
  | { food_name: string; quantity: number; unit: FoodUnit; category: FoodCategory };

function validateQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Số lượng phải lớn hơn 0.");
}

function resolveShoppingItemStatus(required: number, bought: number): { item_status: ShoppingItemStatus; bought_status: boolean; remaining_quantity: number } {
  const remaining = Math.max(0, required - bought);
  if (bought >= required) return { item_status: "COMPLETED", bought_status: true, remaining_quantity: 0 };
  if (bought > 0) return { item_status: "PARTIAL", bought_status: false, remaining_quantity: remaining };
  return { item_status: "PENDING", bought_status: false, remaining_quantity: required };
}

function attachItems(state: Awaited<ReturnType<typeof db>>, list: ShoppingList): ShoppingListDetail {
  return {
    ...list,
    items: state.shopping_list_items
      .filter((item) => item.shopping_list_id === list.shopping_list_id)
      .map((item) => ({ ...item, food: state.foods.find((food) => food.food_id === item.food_id)! })),
  };
}

function createManualFood(state: Awaited<ReturnType<typeof db>>, item: Extract<ShoppingCreateItem, { food_name: string }>) {
  const name = item.food_name.trim();
  if (!name) throw new Error("Tên nguyên liệu là bắt buộc.");
  const existing = state.foods.find((food) => food.food_name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.food_id;
  const food: Food = {
    food_id: uid("food"),
    food_name: name,
    unit: item.unit,
    category: item.category,
    icon: "🧺",
  };
  state.foods.push(food);
  return food.food_id;
}

export const shoppingApi = {
  endpoint: endpoints.shopping,
  async list(family_id: string): Promise<ShoppingListDetail[]> {
    const state = await db();
    return state.shopping_lists
      .filter((list) => list.family_id === family_id)
      .map((list) => attachItems(state, list));
  },
  async detail(shopping_list_id: string): Promise<ShoppingListDetail> {
    const state = await db();
    const list = state.shopping_lists.find((item) => item.shopping_list_id === shopping_list_id);
    if (!list) throw new Error("Không tìm thấy danh sách mua sắm.");
    return attachItems(state, list);
  },
  async create(payload: { family_id: string; title: string; plan_date: string; list_type: ShoppingType; created_by: string; items: ShoppingCreateItem[]; share_member_ids?: string[] }) {
    if (!payload.title || !payload.list_type) throw new Error("Vui lòng nhập tiêu đề và kiểu danh sách.");
    if (!payload.items.length) throw new Error("Danh sách cần ít nhất 1 sản phẩm.");
    const state = await db();
    if (!state.families.some((family) => family.family_id === payload.family_id)) throw new Error("Người dùng chưa có nhóm gia đình.");

    const list: ShoppingList = {
      shopping_list_id: uid("shopping"),
      family_id: payload.family_id,
      title: payload.title,
      plan_date: payload.plan_date,
      list_type: payload.list_type,
      status: "DRAFT",
      created_by: payload.created_by,
      assigned_user_id: payload.share_member_ids?.[0],
    };

    state.shopping_lists.unshift(list);
    state.shopping_list_items.push(...payload.items.map((item) => {
      const foodId = "food_id" in item ? item.food_id : createManualFood(state, item);
      validateQuantity(item.quantity);
      return {
        id: uid("shopping-item"),
        shopping_list_id: list.shopping_list_id,
        food_id: foodId,
        quantity: item.quantity,
        bought_quantity: 0,
        remaining_quantity: item.quantity,
        item_status: "PENDING" as const,
        inventory_synced_quantity: 0,
        bought_status: false,
      };
    }));
    addActivity(state, payload.family_id, payload.created_by, "shopping", `tạo danh sách "${payload.title}" và chia sẻ cho gia đình`);
    saveDb(state);
    return list;
  },
  async upsertItem(shopping_list_id: string, payload: ShoppingCreateItem) {
    const state = await db();
    const list = state.shopping_lists.find((item) => item.shopping_list_id === shopping_list_id);
    if (!list) throw new Error("Không tìm thấy danh sách.");
    const foodId = "food_id" in payload ? payload.food_id : createManualFood(state, payload);
    validateQuantity(payload.quantity);
    state.shopping_list_items.push({
      id: uid("shopping-item"),
      shopping_list_id,
      food_id: foodId,
      quantity: payload.quantity,
      bought_quantity: 0,
      remaining_quantity: payload.quantity,
      item_status: "PENDING",
      inventory_synced_quantity: 0,
      bought_status: false,
    });
    saveDb(state);
  },
  async deleteItems(shopping_list_id: string, itemIds: string[]) {
    const state = await db();
    if (!itemIds.length) throw new Error("Chưa chọn mặt hàng để xóa.");
    state.shopping_list_items = state.shopping_list_items.filter((item) => item.shopping_list_id !== shopping_list_id || !itemIds.includes(item.id));
    saveDb(state);
  },
  async recordPurchase(item_id: string, boughtQuantity: number) {
    validateQuantity(boughtQuantity);
    const state = await db();
    const item = state.shopping_list_items.find((row) => row.id === item_id);
    if (!item) throw new Error("Không tìm thấy mặt hàng.");
    const list = state.shopping_lists.find((row) => row.shopping_list_id === item.shopping_list_id);
    if (!list) throw new Error("Không tìm thấy danh sách.");

    const previousSynced = item.inventory_synced_quantity ?? 0;
    if (boughtQuantity < previousSynced) {
      throw new Error("Không thể giảm số lượng đã cập nhật vào tủ lạnh. Hãy tạo điều chỉnh trong tủ lạnh nếu cần.");
    }
    const delta = Math.max(0, boughtQuantity - previousSynced);
    if (delta > 0) {
      addInventory(state, { family_id: list.family_id, food_id: item.food_id, quantity: delta });
      item.inventory_synced_quantity = previousSynced + delta;
    }

    item.bought_quantity = boughtQuantity;
    Object.assign(item, resolveShoppingItemStatus(item.quantity, boughtQuantity));

    const allCompleted = state.shopping_list_items
      .filter((row) => row.shopping_list_id === list.shopping_list_id)
      .every((row) => row.item_status === "COMPLETED");
    list.status = allCompleted ? "DONE" : "DRAFT";

    const session = getSession();
    if (session) addActivity(state, list.family_id, session.user_id, "shopping", `cập nhật mua ${boughtQuantity} cho mặt hàng`,);
    saveDb(state);
    return item;
  },
  async complete(shopping_list_id: string) {
    const state = await db();
    const list = state.shopping_lists.find((item) => item.shopping_list_id === shopping_list_id);
    if (!list) throw new Error("Không tìm thấy danh sách.");
    const items = state.shopping_list_items.filter((item) => item.shopping_list_id === shopping_list_id);
    if (!items.every((item) => item.item_status === "COMPLETED")) {
      throw new Error("Danh sách chỉ hoàn tất khi tất cả mặt hàng đã completed.");
    }
    list.status = "DONE";
    const session = getSession();
    if (session) addActivity(state, list.family_id, session.user_id, "shopping", "hoàn tất danh sách mua sắm");
    saveDb(state);
  },
};
