import { endpoints } from "@/shared/constants/endpoints";
import type { MealPlan, MealPlanGroup } from "@/types";
import { uid } from "@/shared/utils/storage";
import { addActivity, db, getSession, saveDb } from "@/shared/lib/mockDb";
import { recipeApi } from "@/modules/recipe/api/recipeApi";

export const mealApi = {
  endpoint: endpoints.mealPlans,
  async list(family_id: string): Promise<MealPlan[]> {
    const state = await db();
    return state.meal_plans.filter((item) => item.family_id === family_id);
  },
  async grouped(family_id: string): Promise<MealPlanGroup[]> {
    const rows = await this.list(family_id);
    const map = new Map<string, MealPlanGroup>();
    rows.forEach((row) => {
      const key = `${row.meal_date}-${row.meal_type}`;
      if (!map.has(key)) map.set(key, { family_id, meal_date: row.meal_date, meal_type: row.meal_type, recipe_ids: [] });
      map.get(key)!.recipe_ids.push(row.recipe_id);
    });
    return [...map.values()];
  },
  async createShoppingListForMissing(family_id: string, user_id: string, title: string) {
    const suggestions = await recipeApi.suggestions(family_id);
    const missing = suggestions.flatMap((item) => item.missing);
    const unique = new Map(missing.map((row) => [row.food.food_id, row]));
    const state = await db();
    const list = { shopping_list_id: uid("shopping"), family_id, title, plan_date: new Date().toISOString().slice(0, 10), status: "DRAFT" as const, created_by: user_id, list_type: "daily" as const };
    state.shopping_lists.unshift(list);
    [...unique.values()].forEach((row) => state.shopping_list_items.push({
      id: uid("shopping-item"),
      shopping_list_id: list.shopping_list_id,
      food_id: row.food.food_id,
      quantity: row.quantity,
      bought_quantity: 0,
      remaining_quantity: row.quantity,
      item_status: "PENDING",
      inventory_synced_quantity: 0,
      bought_status: false,
    }));
    addActivity(state, family_id, user_id, "shopping", "tự động tạo danh sách bổ sung nguyên liệu thiếu");
    saveDb(state);
    return list;
  },
};
