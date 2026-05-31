import { apiClient, unwrapApiData } from "@/shared/api/apiClient";
import { foodApi } from "@/shared/api/foodApi";
import type { Food, FoodCategory, FoodLocation, FoodUnit, FridgeItem } from "@/types";
import { todayIso } from "@/shared/utils/date";

export type FridgeRow = FridgeItem & { food: Food };

type BackendFridgeItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  storageLocation: string;
  foodId?: string | null;
  category?: { id: string; name: string | null } | null;
  familyGroupId?: string | null;
};

type ListResponse = {
  items: BackendFridgeItem[];
};

type ItemResponse = {
  item: BackendFridgeItem;
};

function validateInventoryPayload(
  payload: { food_id?: string; quantity?: number; expiry_date?: string; location?: string },
  options: { allowZero?: boolean } = {},
) {
  if (!payload.food_id || payload.quantity === undefined || !payload.expiry_date || !payload.location) {
    throw new Error("Vui lòng nhập đầy đủ thông tin thực phẩm.");
  }
  if (!Number.isFinite(payload.quantity) || payload.quantity < 0 || (!options.allowZero && payload.quantity === 0)) {
    throw new Error(options.allowZero ? "Số lượng không được âm." : "Số lượng phải lớn hơn 0.");
  }
  if (payload.expiry_date < todayIso()) throw new Error("Ngày hết hạn không hợp lệ.");
}

function toFridgeRow(item: BackendFridgeItem, family_id: string): FridgeRow {
  const food_id = item.foodId || item.id;
  const categoryName = (item.category?.name || "Khác") as FoodCategory;
  const unit = (item.unit || "miếng") as FoodUnit;
  const location = item.storageLocation as FoodLocation;

  return {
    fridge_item_id: item.id,
    family_id,
    food_id,
    quantity: item.quantity,
    expiry_date: item.expiryDate,
    location,
    food: {
      food_id,
      food_name: item.name,
      category: categoryName,
      unit,
      icon: "🍽️",
    },
  };
}

async function resolveFood(food_id: string) {
  const foods = await foodApi.list();
  const food = foods.find((f) => f.food_id === food_id);
  if (!food) throw new Error("Không tìm thấy thực phẩm trong danh mục.");
  return food;
}

function toCreateBody(
  payload: Omit<FridgeItem, "fridge_item_id">,
  food: Food,
) {
  return {
    name: food.food_name,
    quantity: payload.quantity,
    unit: food.unit,
    expiryDate: payload.expiry_date,
    storageLocation: payload.location,
    familyGroupId: payload.family_id,
    foodId: payload.food_id,
    categoryId: null,
  };
}

function toUpdateBody(
  payload: Omit<FridgeItem, "fridge_item_id" | "family_id">,
  food: Food,
) {
  return {
    name: food.food_name,
    quantity: payload.quantity,
    unit: food.unit,
    expiryDate: payload.expiry_date,
    storageLocation: payload.location,
    foodId: payload.food_id,
    categoryId: null,
  };
}

export const fridgeApi = {
  endpoint: "/fridge",

  async list(family_id: string): Promise<FridgeRow[]> {
    const data = unwrapApiData<ListResponse>(
      await apiClient.get("/fridge/items", {
        params: {
          familyGroupId: family_id,
          limit: 200,
          sortBy: "expiryDate",
          sortOrder: "asc",
        },
      }),
    );
    return data.items.map((item) => toFridgeRow(item, family_id));
  },

  async create(payload: Omit<FridgeItem, "fridge_item_id">): Promise<FridgeItem> {
    validateInventoryPayload(payload);
    const food = await resolveFood(payload.food_id);
    const data = unwrapApiData<ItemResponse>(
      await apiClient.post("/fridge/items", toCreateBody(payload, food)),
    );
    const row = toFridgeRow(data.item, payload.family_id);
    return {
      fridge_item_id: row.fridge_item_id,
      family_id: row.family_id,
      food_id: row.food_id,
      quantity: row.quantity,
      expiry_date: row.expiry_date,
      location: row.location,
    };
  },

  async update(
    fridge_item_id: string,
    payload: Omit<FridgeItem, "fridge_item_id" | "family_id">,
    family_id?: string,
  ): Promise<FridgeItem> {
    validateInventoryPayload({ ...payload, food_id: payload.food_id }, { allowZero: true });
    const food = await resolveFood(payload.food_id);
    const data = unwrapApiData<ItemResponse>(
      await apiClient.put(`/fridge/items/${fridge_item_id}`, toUpdateBody(payload, food)),
    );
    const resolvedFamily = family_id || data.item.familyGroupId || "";
    const row = toFridgeRow(data.item, resolvedFamily);
    return {
      fridge_item_id: row.fridge_item_id,
      family_id: row.family_id,
      food_id: row.food_id,
      quantity: row.quantity,
      expiry_date: row.expiry_date,
      location: row.location,
    };
  },

  async remove(fridge_item_id: string) {
    await apiClient.delete(`/fridge/items/${fridge_item_id}`);
  },

  async removeMany(fridge_item_ids: string[]) {
    if (!fridge_item_ids.length) return;
    await apiClient.delete("/fridge/items/bulk", { data: { ids: fridge_item_ids } });
  },
};
