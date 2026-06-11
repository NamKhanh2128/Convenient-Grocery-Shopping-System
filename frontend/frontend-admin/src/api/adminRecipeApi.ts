import { http } from "@/lib/httpClient";
import type { Recipe, RecipeIngredient, Unit, FoodCategory } from "@/types";

export type RecipeIngredientWithMeta = RecipeIngredient & {
  unit_name?: string | null;
  unit_symbol?: string | null;
  category_name_vi?: string | null;
  category_name_en?: string | null;
};

export type RecipeWithIngredients = Recipe & {
  ingredients: RecipeIngredientWithMeta[];
};

export type IngredientInput = {
  name: string;
  quantity: number;
  unit_id: number;
  category_id?: number | null;
};

export type RecipePayload = Omit<Recipe, "id" | "created_at" | "updated_at">;

type RecipeListResult = { success: boolean; data: { recipes: RecipeWithIngredients[] } };
type RecipeResult = { success: boolean; data: RecipeWithIngredients };
type UnitsResult = { success: boolean; data: { units: Unit[] } };
type CategoriesResult = { success: boolean; data: { categories: FoodCategory[] } };

export const adminRecipeApi = {
  async list(params?: { search?: string }): Promise<RecipeWithIngredients[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    const res = await http.get<RecipeListResult>(`/api/admin/recipes?${qs.toString()}`);
    return res.data.recipes;
  },

  async getById(id: number): Promise<RecipeWithIngredients> {
    const res = await http.get<RecipeResult>(`/api/admin/recipes/${id}`);
    return res.data;
  },

  async create(payload: RecipePayload, ingredients: IngredientInput[]): Promise<RecipeWithIngredients> {
    const res = await http.post<RecipeResult>("/api/admin/recipes", { ...payload, ingredients });
    return res.data;
  },

  async update(id: number, payload: Partial<RecipePayload>, ingredients?: IngredientInput[]): Promise<RecipeWithIngredients> {
    const res = await http.put<RecipeResult>(`/api/admin/recipes/${id}`, { ...payload, ingredients });
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/api/admin/recipes/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await http.post("/api/admin/recipes/bulk-delete", { ids });
  },

  async getUnits(): Promise<Unit[]> {
    const res = await http.get<UnitsResult>("/api/admin/recipes/meta/units");
    return res.data.units;
  },

  async getCategories(): Promise<FoodCategory[]> {
    const res = await http.get<CategoriesResult>("/api/admin/recipes/meta/categories");
    return res.data.categories;
  },
};
