import { http } from "@/lib/httpClient";
import type { RecipeCategory } from "@/types";

export type RecipeCategoryPayload = {
  ten_danh_muc: string;
  mo_ta?: string | null;
};

type CategoryListResult = { success: boolean; data: { categories: RecipeCategory[] } };
type CategoryResult = { success: boolean; data: RecipeCategory };

export const adminRecipeCategoryApi = {
  async list(params?: { search?: string }): Promise<RecipeCategory[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    const res = await http.get<CategoryListResult>(`/api/admin/recipe-categories?${qs.toString()}`);
    return res.data.categories;
  },

  async getById(id: number): Promise<RecipeCategory> {
    const res = await http.get<CategoryResult>(`/api/admin/recipe-categories/${id}`);
    return res.data;
  },

  async create(payload: RecipeCategoryPayload): Promise<RecipeCategory> {
    const res = await http.post<CategoryResult>("/api/admin/recipe-categories", payload);
    return res.data;
  },

  async update(id: number, payload: Partial<RecipeCategoryPayload>): Promise<RecipeCategory> {
    const res = await http.put<CategoryResult>(`/api/admin/recipe-categories/${id}`, payload);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/api/admin/recipe-categories/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await http.post("/api/admin/recipe-categories/bulk-delete", { ids });
  },
};
