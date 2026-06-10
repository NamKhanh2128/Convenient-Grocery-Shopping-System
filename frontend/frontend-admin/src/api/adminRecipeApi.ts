import { http } from "@/lib/httpClient";
import type { Recipe, RecipeIngredient } from "@/types";

export type RecipeWithIngredients = Recipe & {
  ingredients: (RecipeIngredient & {
    food_name?: string;
    unit?: string;
    icon?: string;
  })[];
};

type RecipeListResult = { success: boolean; data: { recipes: RecipeWithIngredients[] } };
type RecipeResult = { success: boolean; data: RecipeWithIngredients };

export const adminRecipeApi = {
  async list(params?: { search?: string }): Promise<RecipeWithIngredients[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    const res = await http.get<RecipeListResult>(`/api/admin/recipes?${qs.toString()}`);
    return res.data.recipes;
  },

  async getById(recipe_id: string): Promise<RecipeWithIngredients> {
    const res = await http.get<RecipeResult>(`/api/admin/recipes/${recipe_id}`);
    return res.data;
  },

  async create(
    payload: Omit<Recipe, "recipe_id">,
    ingredients: Omit<RecipeIngredient, "id" | "recipe_id">[]
  ): Promise<RecipeWithIngredients> {
    const res = await http.post<RecipeResult>("/api/admin/recipes", {
      ...payload,
      ingredients,
    });
    return res.data;
  },

  async update(
    recipe_id: string,
    payload: Partial<Recipe>,
    ingredients?: Omit<RecipeIngredient, "id" | "recipe_id">[]
  ): Promise<RecipeWithIngredients> {
    const res = await http.put<RecipeResult>(`/api/admin/recipes/${recipe_id}`, {
      ...payload,
      ingredients,
    });
    return res.data;
  },

  async delete(recipe_id: string): Promise<void> {
    await http.delete(`/api/admin/recipes/${recipe_id}`);
  },

  async bulkDelete(recipe_ids: string[]): Promise<void> {
    await http.post("/api/admin/recipes/bulk-delete", { ids: recipe_ids });
  },
};
