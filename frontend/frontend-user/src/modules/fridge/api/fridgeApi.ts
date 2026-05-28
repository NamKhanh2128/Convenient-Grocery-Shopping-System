import { endpoints } from "@/shared/constants/endpoints";
import type { Food, FridgeItem } from "@/types";
import { todayIso } from "@/shared/utils/date";
import { addActivity, addInventory, db, getSession, saveDb, updateInventory } from "@/shared/lib/mockDb";

export type FridgeRow = FridgeItem & { food: Food };

function validateInventoryPayload(payload: { food_id?: string; quantity?: number; expiry_date?: string; location?: string }, options: { allowZero?: boolean } = {}) {
  if (!payload.food_id || payload.quantity === undefined || !payload.expiry_date || !payload.location) {
    throw new Error("Vui lòng nhập đầy đủ thông tin thực phẩm.");
  }
  if (!Number.isFinite(payload.quantity) || payload.quantity < 0 || (!options.allowZero && payload.quantity === 0)) {
    throw new Error(options.allowZero ? "Số lượng không được âm." : "Số lượng phải lớn hơn 0.");
  }
  if (payload.expiry_date < todayIso()) throw new Error("Ngày hết hạn không hợp lệ.");
}

export const fridgeApi = {
  endpoint: endpoints.fridge,
  async list(family_id: string): Promise<FridgeRow[]> {
    const state = await db();
    return state.fridge_items
      .filter((item) => item.family_id === family_id)
      .map((item) => ({ ...item, food: state.foods.find((food) => food.food_id === item.food_id)! }));
  },
  async create(payload: Omit<FridgeItem, "fridge_item_id">): Promise<FridgeItem> {
    validateInventoryPayload(payload);
    const state = await db();
    const item = addInventory(state, payload);
    const session = getSession();
    if (session) addActivity(state, payload.family_id, session.user_id, "fridge", "thêm thực phẩm vào tủ lạnh");
    saveDb(state);
    return item;
  },
  async update(fridge_item_id: string, payload: Omit<FridgeItem, "fridge_item_id" | "family_id">): Promise<FridgeItem> {
    validateInventoryPayload({ ...payload, food_id: payload.food_id }, { allowZero: true });
    const state = await db();
    const item = updateInventory(state, fridge_item_id, payload);
    const session = getSession();
    if (session) addActivity(state, item.family_id, session.user_id, "fridge", "cập nhật thực phẩm trong tủ lạnh");
    saveDb(state);
    return item;
  },
  async remove(fridge_item_id: string) {
    const state = await db();
    const item = state.fridge_items.find((row) => row.fridge_item_id === fridge_item_id);
    state.fridge_items = state.fridge_items.filter((row) => row.fridge_item_id !== fridge_item_id);
    const session = getSession();
    if (session && item) addActivity(state, item.family_id, session.user_id, "fridge", "xóa thực phẩm khỏi tủ lạnh");
    saveDb(state);
  },
  async removeMany(fridge_item_ids: string[]) {
    if (!fridge_item_ids.length) return;
    const state = await db();
    const removed = state.fridge_items.filter((row) => fridge_item_ids.includes(row.fridge_item_id));
    state.fridge_items = state.fridge_items.filter((row) => !fridge_item_ids.includes(row.fridge_item_id));
    const session = getSession();
    const familyId = removed[0]?.family_id;
    if (session && familyId) {
      addActivity(state, familyId, session.user_id, "fridge", `xóa ${removed.length} thực phẩm khỏi tủ lạnh`);
    }
    saveDb(state);
  },
};
