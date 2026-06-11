import { http } from "@/lib/httpClient";
import type { Food } from "@/types";

/** Food with joined display names from food_categories and units tables */
export interface FoodWithMeta extends Food {
  category_name_vi: string | null;
  category_name_en: string | null;
  unit_name: string | null;
  unit_symbol: string | null;
}

type FoodListResult = { success: boolean; data: { foods: FoodWithMeta[] } };
type FoodResult = { success: boolean; data: FoodWithMeta };

export type FoodCreatePayload = {
  food_name: string;
  unit_id: number;
  category_id: number;
  icon?: string | null;
};

export type FoodUpdatePayload = Partial<FoodCreatePayload>;

export const adminFoodApi = {
  async list(params?: { search?: string; category_id?: number }): Promise<FoodWithMeta[]> {
    const qs = new URLSearchParams();
    if (params?.search)      qs.set("search", params.search);
    if (params?.category_id) qs.set("category_id", String(params.category_id));
    const res = await http.get<FoodListResult>(`/api/admin/foods?${qs.toString()}`);
    return res.data.foods;
  },

  async getById(id: number): Promise<FoodWithMeta> {
    const res = await http.get<FoodResult>(`/api/admin/foods/${id}`);
    return res.data;
  },

  async create(payload: FoodCreatePayload): Promise<FoodWithMeta> {
    const res = await http.post<FoodResult>("/api/admin/foods", payload);
    return res.data;
  },

  async update(id: number, payload: FoodUpdatePayload): Promise<FoodWithMeta> {
    const res = await http.put<FoodResult>(`/api/admin/foods/${id}`, payload);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/api/admin/foods/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await http.post("/api/admin/foods/bulk-delete", { ids });
  },
};
