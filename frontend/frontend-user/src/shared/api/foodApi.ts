import { apiClient, unwrapApiData } from "@/shared/api/apiClient";
import { endpoints } from "@/shared/constants/endpoints";
import type { Food, FoodCategory } from "@/types";
import { db } from "@/shared/lib/mockDb";
import { normalizeFoodUnit } from "@/shared/utils/units";

const useFoodBackend = import.meta.env.VITE_USE_FOOD_API !== "false";

function toFoodCategory(value?: string): FoodCategory {
  const allowed: FoodCategory[] = ["Rau củ", "Thịt cá", "Đồ khô", "Sữa & Trứng", "Gia vị", "Khác"];
  return allowed.includes(value as FoodCategory) ? (value as FoodCategory) : "Khác";
}

type BackendFood = {
  id: string;
  food_name: string;
  category?: string;
  unit?: string;
  icon?: string;
};

export const foodApi = {
  endpoint: endpoints.foods,

  async list(search?: string): Promise<Food[]> {
    if (useFoodBackend) {
      const data = unwrapApiData<{ foods: BackendFood[] }>(
        await apiClient.get("/foods", search ? { params: { search } } : {}),
      );
      return data.foods.map((food) => ({
        food_id: String(food.id),
        food_name: food.food_name,
        category: toFoodCategory(food.category),
        unit: normalizeFoodUnit(food.unit),
        icon: food.icon || "🍽️",
      }));
    }
    const state = await db();
    const rows = [...state.foods].sort((a, b) => a.food_name.localeCompare(b.food_name, "vi"));
    if (!search?.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((f) => f.food_name.toLowerCase().includes(q));
  },
};
