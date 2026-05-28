import { endpoints } from "@/shared/constants/endpoints";
import type { Food, Recipe, RecipeIngredient, RecipeSuggestion } from "@/types";
import { addActivity, consumeInventory, db, getSession, saveDb } from "@/shared/lib/mockDb";

export type RecipeDetail = Recipe & { ingredients: Array<RecipeIngredient & { food: Food }> };

function recipeDetail(recipe: Recipe, ingredients: RecipeIngredient[], foods: Food[]): RecipeDetail {
  return { ...recipe, ingredients: ingredients.filter((item) => item.recipe_id === recipe.recipe_id).map((item) => ({ ...item, food: foods.find((food) => food.food_id === item.food_id)! })) };
}

export const recipeApi = {
  endpoint: endpoints.recipes,
  async list(): Promise<RecipeDetail[]> {
    const state = await db();
    return state.recipes.map((recipe) => recipeDetail(recipe, state.recipe_ingredients, state.foods));
  },
  async detail(recipe_id: string): Promise<RecipeDetail> {
    const state = await db();
    const recipe = state.recipes.find((item) => item.recipe_id === recipe_id);
    if (!recipe) throw new Error("Không tìm thấy công thức.");
    return recipeDetail(recipe, state.recipe_ingredients, state.foods);
  },
  async suggestions(family_id: string): Promise<RecipeSuggestion[]> {
    const state = await db();
    const fridge = state.fridge_items.filter((item) => item.family_id === family_id);
    return state.recipes
      .map((recipe) => {
        const ingredients = state.recipe_ingredients.filter((item) => item.recipe_id === recipe.recipe_id);
        const missing = ingredients
          .filter((ingredient) => !fridge.some((item) => item.food_id === ingredient.food_id && item.quantity >= ingredient.quantity))
          .map((ingredient) => ({ food: state.foods.find((food) => food.food_id === ingredient.food_id)!, quantity: ingredient.quantity }));
        return {
          recipe,
          available_food_ids: ingredients.filter((ingredient) => fridge.some((item) => item.food_id === ingredient.food_id)).map((item) => item.food_id),
          missing,
        };
      })
      .sort((a, b) => a.missing.length - b.missing.length);
  },
  async markCooked(family_id: string, recipe_id: string) {
    const state = await db();
    const ingredients = state.recipe_ingredients.filter((item) => item.recipe_id === recipe_id);
    ingredients.forEach((ingredient) => {
      consumeInventory(state, { family_id, food_id: ingredient.food_id, quantity: ingredient.quantity });
    });
    const session = getSession();
    if (session) addActivity(state, family_id, session.user_id, "recipe", "nấu ăn và cập nhật lại nguyên liệu trong tủ lạnh");
    saveDb(state);
  },
};
