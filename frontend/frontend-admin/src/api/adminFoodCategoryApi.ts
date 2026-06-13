import { http } from "@/lib/httpClient";
import type { FoodCategory } from "@/types";

export type FoodCategoryWithCount = FoodCategory & { food_count: number };

export type FoodCategoryPayload = {
  name_vi: string;
  name_en?: string;
  description?: string | null;
};

type ListResult = { success: boolean; data: { categories: FoodCategoryWithCount[] } };
type DetailResult = { success: boolean; data: FoodCategoryWithCount };

export const adminFoodCategoryApi = {
  async list(params?: { search?: string }): Promise<FoodCategoryWithCount[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    const res = await http.get<ListResult>(`/api/admin/food-categories?${qs.toString()}`);
    return res.data.categories;
  },

  async getById(id: number): Promise<FoodCategoryWithCount> {
    const res = await http.get<DetailResult>(`/api/admin/food-categories/${id}`);
    return res.data;
  },

  async create(payload: FoodCategoryPayload): Promise<FoodCategoryWithCount> {
    const res = await http.post<DetailResult>("/api/admin/food-categories", payload);
    return res.data;
  },

  async update(id: number, payload: Partial<FoodCategoryPayload>): Promise<FoodCategoryWithCount> {
    const res = await http.put<DetailResult>(`/api/admin/food-categories/${id}`, payload);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/api/admin/food-categories/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await http.post("/api/admin/food-categories/bulk-delete", { ids });
  },
};
