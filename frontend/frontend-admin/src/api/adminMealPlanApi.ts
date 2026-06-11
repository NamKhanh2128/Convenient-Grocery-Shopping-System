import { http } from "@/lib/httpClient";
import type { MealPlan, MealPlanItem } from "@/types";

export interface MealPlanSummary extends MealPlan {
  user_name: string | null;
  user_email: string | null;
  item_count: number;
  cooked_count: number;
}

export interface MealPlanItemWithMeta extends MealPlanItem {
  recipe_name: string | null;
}

export interface MealPlanWithItems extends MealPlanSummary {
  items: MealPlanItemWithMeta[];
}

export type MealPlanUpdatePayload = {
  plan_type?: string;
  start_date?: string;
  end_date?: string;
  status?: string | null;
};

export type MealPlanItemUpdatePayload = {
  is_cooked?: boolean;
  meal_date?: string;
  meal_type?: string;
  recipe_id?: number;
};

export interface MealPlanUser {
  id: number;
  full_name: string;
  email: string;
}

export interface MealPlanRecipe {
  id: number;
  name_vi: string;
  name_en: string;
}

type ListResult = { success: boolean; data: { plans: MealPlanSummary[] } };
type DetailResult = { success: boolean; data: MealPlanWithItems };
type UsersResult = { success: boolean; data: { users: MealPlanUser[] } };
type RecipesResult = { success: boolean; data: { recipes: MealPlanRecipe[] } };

export const adminMealPlanApi = {
  async list(params?: { search?: string; status?: string }): Promise<MealPlanSummary[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    const res = await http.get<ListResult>(`/api/admin/meal-plans?${qs.toString()}`);
    return res.data.plans;
  },

  async getById(id: number): Promise<MealPlanWithItems> {
    const res = await http.get<DetailResult>(`/api/admin/meal-plans/${id}`);
    return res.data;
  },

  async update(id: number, payload: MealPlanUpdatePayload): Promise<MealPlanWithItems> {
    const res = await http.put<DetailResult>(`/api/admin/meal-plans/${id}`, payload);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/api/admin/meal-plans/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await http.post("/api/admin/meal-plans/bulk-delete", { ids });
  },

  async updateItem(planId: number, itemId: number, payload: MealPlanItemUpdatePayload): Promise<MealPlanWithItems> {
    const res = await http.put<DetailResult>(`/api/admin/meal-plans/${planId}/items/${itemId}`, payload);
    return res.data;
  },

  async deleteItem(planId: number, itemId: number): Promise<MealPlanWithItems> {
    const res = await http.delete<DetailResult>(`/api/admin/meal-plans/${planId}/items/${itemId}`);
    return res.data;
  },

  async getUsers(): Promise<MealPlanUser[]> {
    const res = await http.get<UsersResult>(`/api/admin/meal-plans/meta/users`);
    return res.data.users;
  },

  async getRecipes(): Promise<MealPlanRecipe[]> {
    const res = await http.get<RecipesResult>(`/api/admin/meal-plans/meta/recipes`);
    return res.data.recipes;
  },
};
