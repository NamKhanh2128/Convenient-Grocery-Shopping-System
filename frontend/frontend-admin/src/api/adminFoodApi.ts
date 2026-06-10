import { http } from "@/lib/httpClient";
import type { Food } from "@/types";

type FoodListResult = { success: boolean; data: { foods: Food[] } };
type FoodResult = { success: boolean; data: Food };

export const adminFoodApi = {
  async list(params?: { search?: string; category?: string }): Promise<Food[]> {
    const qs = new URLSearchParams();
    if (params?.search)   qs.set("search", params.search);
    if (params?.category) qs.set("category", params.category);
    const res = await http.get<FoodListResult>(`/api/admin/foods?${qs.toString()}`);
    return res.data.foods;
  },

  async create(payload: { food_name: string; category?: string; unit?: string; icon?: string }): Promise<Food> {
    const res = await http.post<FoodResult>("/api/admin/foods", payload);
    return res.data;
  },

  async update(food_id: string, payload: Partial<Food>): Promise<Food> {
    const res = await http.put<FoodResult>(`/api/admin/foods/${food_id}`, payload);
    return res.data;
  },

  async delete(food_id: string): Promise<void> {
    await http.delete(`/api/admin/foods/${food_id}`);
  },

  async bulkDelete(food_ids: string[]): Promise<void> {
    await http.post("/api/admin/foods/bulk-delete", { ids: food_ids });
  },
};
