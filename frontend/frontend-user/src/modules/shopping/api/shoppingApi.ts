import { apiClient } from "@/shared/api/apiClient";

import { endpoints } from "@/shared/constants/endpoints";

import type { Food, FoodCategory, FoodUnit, ShoppingItemStatus, ShoppingList, ShoppingListItem, ShoppingType } from "@/types";

import { addActivity, addInventory, db, getSession, saveDb } from "@/shared/lib/mockDb";

import { uid } from "@/shared/utils/storage";

import { normalizePlanDate, todayIso } from "@/shared/utils/date";



export type ShoppingListDetail = ShoppingList & { items: Array<ShoppingListItem & { food: Food }> };

export type ShoppingCreateItem =

  | { food_id: string; quantity: number; food_name?: string }

  | { food_name: string; quantity: number; unit: FoodUnit; category: FoodCategory };



const useShoppingBackend = import.meta.env.VITE_USE_SHOPPING_API !== "false";



type BackendShoppingItem = {

  id: string;

  shopping_list_id: string;

  food_id: string | null;

  name?: string;

  quantity: number;

  bought_quantity?: number;

  remaining_quantity?: number;

  item_status?: ShoppingItemStatus;

  bought_status?: boolean;

  inventory_synced_quantity?: number;

  food?: {

    food_id: string;

    food_name: string;

    icon?: string;

    category?: string;

    unit?: string;

  } | null;

};



type BackendShoppingList = {

  id: string | number;

  shopping_list_id?: string;

  group_id?: number;

  name: string;

  plan_date?: string;

  list_type?: string;

  status?: string;

  user_id?: number;

  items?: BackendShoppingItem[];

};



function apiError(error: unknown): string {

  if (error && typeof error === "object" && "response" in error) {

    const res = (error as { response?: { data?: { message?: string } } }).response;

    if (res?.data?.message) return res.data.message;

  }

  if (error instanceof Error) return error.message;

  return "Yêu cầu API thất bại.";

}



function validateQuantity(quantity: number) {

  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Số lượng phải lớn hơn 0.");

}



function resolveShoppingItemStatus(required: number, bought: number): { item_status: ShoppingItemStatus; bought_status: boolean; remaining_quantity: number } {

  const remaining = Math.max(0, required - bought);

  if (bought >= required) return { item_status: "COMPLETED", bought_status: true, remaining_quantity: 0 };

  if (bought > 0) return { item_status: "PARTIAL", bought_status: false, remaining_quantity: remaining };

  return { item_status: "PENDING", bought_status: false, remaining_quantity: required };

}



function toFoodCategory(value?: string): FoodCategory {

  const allowed: FoodCategory[] = ["Rau củ", "Thịt cá", "Đồ khô", "Sữa & Trứng", "Gia vị", "Khác"];

  return allowed.includes(value as FoodCategory) ? (value as FoodCategory) : "Khác";

}



function toFoodUnit(value?: string): FoodUnit {

  const allowed: FoodUnit[] = ["kg", "g", "lít", "ml", "quả", "củ", "miếng", "gói"];

  return allowed.includes(value as FoodUnit) ? (value as FoodUnit) : "g";

}



function mapBackendItem(item: BackendShoppingItem): ShoppingListItem & { food: Food } {

  const foodId = item.food_id || item.food?.food_id || `food-${item.id}`;

  const foodName = item.food?.food_name || item.name || "Thực phẩm";

  return {

    id: String(item.id),

    shopping_list_id: String(item.shopping_list_id),

    food_id: foodId,

    quantity: Number(item.quantity),

    bought_quantity: Number(item.bought_quantity || 0),

    remaining_quantity: Number(item.remaining_quantity ?? item.quantity),

    item_status: (item.item_status || "PENDING") as ShoppingItemStatus,

    inventory_synced_quantity: Number(item.inventory_synced_quantity || 0),

    bought_status: Boolean(item.bought_status),

    food: {

      food_id: foodId,

      food_name: foodName,

      category: toFoodCategory(item.food?.category),

      unit: toFoodUnit(item.food?.unit),

      icon: item.food?.icon || "🧺",

    },

  };

}



function mapBackendList(row: BackendShoppingList, family_id: string): ShoppingListDetail {

  const shopping_list_id = String(row.shopping_list_id || row.id);

  return {

    shopping_list_id,

    family_id,

    title: row.name,

    plan_date: normalizePlanDate(row.plan_date ? String(row.plan_date) : null),

    list_type: row.list_type === "weekly" ? "weekly" : "daily",

    status: row.status === "DONE" || row.status === "completed" ? "DONE" : "DRAFT",

    created_by: String(row.user_id || ""),

    items: (row.items || []).map(mapBackendItem),

  };

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



function toBackendCreateItems(items: ShoppingCreateItem[]) {

  return items.map((item) => {

    if ("food_id" in item) {

      const foodName = item.food_name?.trim()
        || (/^\d+$/.test(item.food_id) ? undefined : item.food_id);

      return {

        food_id: /^\d+$/.test(item.food_id) ? item.food_id : undefined,

        food_name: foodName,

        quantity: item.quantity,

      };

    }

    return {

      food_name: item.food_name,

      quantity: item.quantity,

      unit: item.unit,

      category: item.category,

    };

  });

}



async function backendList(family_id: string): Promise<ShoppingListDetail[]> {

  const res = await apiClient.get<{ data: BackendShoppingList[] }>("/shopping-lists", {
    params: { status: "all", familyGroupId: family_id },
  });

  const rows = res.data.data || [];

  return rows.map((row) => mapBackendList(row, family_id));

}



async function backendDetail(shopping_list_id: string, family_id: string): Promise<ShoppingListDetail> {

  const res = await apiClient.get<{ data: BackendShoppingList }>(`/shopping-lists/${shopping_list_id}`, {
    params: { familyGroupId: family_id },
  });

  return mapBackendList(res.data.data, family_id);

}



export const shoppingApi = {

  endpoint: endpoints.shopping,



  async list(family_id: string): Promise<ShoppingListDetail[]> {

    if (useShoppingBackend) {

      try {

        return await backendList(family_id);

      } catch (error) {

        throw new Error(apiError(error));

      }

    }

    const state = await db();

    return state.shopping_lists

      .filter((list) => list.family_id === family_id)

      .map((list) => attachItems(state, list));

  },



  async detail(shopping_list_id: string, family_id?: string): Promise<ShoppingListDetail> {

    if (useShoppingBackend && family_id) {

      try {

        return await backendDetail(shopping_list_id, family_id);

      } catch (error) {

        throw new Error(apiError(error));

      }

    }

    const state = await db();

    const list = state.shopping_lists.find((item) => item.shopping_list_id === shopping_list_id);

    if (!list) throw new Error("Không tìm thấy danh sách mua sắm.");

    return attachItems(state, list);

  },



  async create(payload: {

    family_id: string;

    title: string;

    plan_date: string;

    list_type: ShoppingType;

    created_by: string;

    items: ShoppingCreateItem[];

    share_member_ids?: string[];

  }): Promise<ShoppingListDetail> {

    if (!payload.title || !payload.list_type) throw new Error("Vui lòng nhập tiêu đề và kiểu danh sách.");

    if (!payload.items.length) throw new Error("Danh sách cần ít nhất 1 sản phẩm.");



    if (useShoppingBackend) {

      try {

        const res = await apiClient.post<{ data: BackendShoppingList }>(
          "/shopping-lists",
          {
            name: payload.title,
            list_type: payload.list_type,
            plan_date: payload.plan_date,
            items: toBackendCreateItems(payload.items),
            share_member_ids: payload.share_member_ids || [],
            familyGroupId: payload.family_id,
          },
          { params: { familyGroupId: payload.family_id } },
        );

        return mapBackendList(res.data.data, payload.family_id);

      } catch (error) {

        throw new Error(apiError(error));

      }

    }



    const state = await db();

    if (!state.families.some((family) => family.family_id === payload.family_id)) {

      throw new Error("Người dùng chưa có nhóm gia đình.");

    }



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

    state.shopping_list_items.push(

      ...payload.items.map((item) => {

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

      }),

    );

    addActivity(state, payload.family_id, payload.created_by, "shopping", `tạo danh sách "${payload.title}" và chia sẻ cho gia đình`);

    saveDb(state);

    return attachItems(state, list);

  },



  async upsertItem(shopping_list_id: string, payload: ShoppingCreateItem, family_id?: string) {

    if (useShoppingBackend && family_id) {

      const body = toBackendCreateItems([payload])[0];

      try {

        await apiClient.post(`/shopping-lists/${shopping_list_id}/items`, body);

        return;

      } catch (error) {

        throw new Error(apiError(error));

      }

    }

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



  async deleteItems(shopping_list_id: string, itemIds: string[], family_id?: string) {

    if (!itemIds.length) throw new Error("Chưa chọn mặt hàng để xóa.");

    if (useShoppingBackend && family_id) {

      try {

        await apiClient.delete(`/shopping-lists/${shopping_list_id}/items`, { data: { item_ids: itemIds } });

        return;

      } catch (error) {

        throw new Error(apiError(error));

      }

    }

    const state = await db();

    state.shopping_list_items = state.shopping_list_items.filter(

      (item) => item.shopping_list_id !== shopping_list_id || !itemIds.includes(item.id),

    );

    saveDb(state);

  },



  async deleteList(shopping_list_id: string, family_id?: string) {

    if (useShoppingBackend && family_id) {

      try {

        await apiClient.delete(`/shopping-lists/${shopping_list_id}`);

        return;

      } catch (error) {

        throw new Error(apiError(error));

      }

    }

    const state = await db();

    state.shopping_lists = state.shopping_lists.filter((list) => list.shopping_list_id !== shopping_list_id);

    state.shopping_list_items = state.shopping_list_items.filter(

      (item) => item.shopping_list_id !== shopping_list_id,

    );

    saveDb(state);

  },



  async recordPurchase(item_id: string, boughtQuantity: number, family_id?: string, shopping_list_id?: string) {

    validateQuantity(boughtQuantity);

    if (useShoppingBackend && family_id && shopping_list_id) {

      try {

        await apiClient.patch(`/shopping-lists/${shopping_list_id}/items/${item_id}/purchased`, {

          bought_quantity: boughtQuantity,

        });

        return;

      } catch (error) {

        throw new Error(apiError(error));

      }

    }

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

    if (session) addActivity(state, list.family_id, session.user_id, "shopping", `cập nhật mua ${boughtQuantity} cho mặt hàng`);

    saveDb(state);

    return item;

  },



  async complete(shopping_list_id: string, family_id?: string) {

    if (useShoppingBackend && family_id) {

      try {

        await apiClient.patch(`/shopping-lists/${shopping_list_id}/complete`);

        return;

      } catch (error) {

        throw new Error(apiError(error));

      }

    }

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


