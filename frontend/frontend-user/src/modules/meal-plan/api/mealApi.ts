import { apiClient, unwrapApiData } from "@/shared/api/apiClient";

import { endpoints } from "@/shared/constants/endpoints";

import type { FoodCategory, FoodUnit, MealPlan, MealPlanGroup } from "@/types";

import { db, saveDb } from "@/shared/lib/mockDb";

import { recipeApi } from "@/modules/recipe/api/recipeApi";

import { shoppingApi } from "@/modules/shopping/api/shoppingApi";
import { todayIso } from "@/shared/utils/date";



const useMealBackend = import.meta.env.VITE_USE_MEAL_API !== "false";



type BackendMealPlan = {

  meal_plan_id: string;

  family_id: string;

  meal_date: string;

  meal_type: MealPlan["meal_type"];

  recipe_id: string;

  is_cooked?: boolean;

};



function groupMeals(rows: MealPlan[]): MealPlanGroup[] {

  const map = new Map<string, MealPlanGroup>();

  rows.forEach((row) => {

    const key = `${row.meal_date}-${row.meal_type}`;

    if (!map.has(key)) {

      map.set(key, {

        family_id: row.family_id,

        meal_date: row.meal_date,

        meal_type: row.meal_type,

        recipe_ids: [],

        cooked_recipe_ids: [],

      });

    }

    map.get(key)!.recipe_ids.push(row.recipe_id);

    if (row.is_cooked) map.get(key)!.cooked_recipe_ids!.push(row.recipe_id);

  });

  return [...map.values()];

}



export const mealApi = {

  endpoint: endpoints.mealPlans,



  async list(family_id: string, range?: { from?: string; to?: string }): Promise<MealPlan[]> {

    if (useMealBackend) {

      const data = unwrapApiData<{ items: BackendMealPlan[] }>(

        await apiClient.get("/meal-plans", {

          params: { familyGroupId: family_id, from: range?.from, to: range?.to },

        }),

      );

      return data.items;

    }

    const state = await db();

    return state.meal_plans.filter((item) => item.family_id === family_id);

  },



  async grouped(family_id: string, range?: { from?: string; to?: string }): Promise<MealPlanGroup[]> {

    return groupMeals(await this.list(family_id, range));

  },



  async add(family_id: string, meal_date: string, meal_type: MealPlan["meal_type"], recipe_id: string) {

    if (useMealBackend) {

      unwrapApiData(

        await apiClient.post("/meal-plans", {

          familyGroupId: family_id,

          meal_date,

          meal_type,

          recipe_id,

        }),

      );

      return;

    }

    const state = await db();

    const exists = state.meal_plans.some(

      (p) => p.family_id === family_id && p.meal_date === meal_date && p.meal_type === meal_type && p.recipe_id === recipe_id,

    );

    if (!exists) {

      state.meal_plans.push({

        meal_plan_id: `meal-${Date.now()}`,

        family_id,

        meal_date,

        meal_type,

        recipe_id,

      });

      saveDb(state);

    }

  },



  async remove(family_id: string, meal_date: string, meal_type: MealPlan["meal_type"], recipe_id: string) {

    if (useMealBackend) {

      unwrapApiData(

        await apiClient.delete("/meal-plans", {

          data: { familyGroupId: family_id, meal_date, meal_type, recipe_id },

        }),

      );

      return;

    }

    const state = await db();

    state.meal_plans = state.meal_plans.filter(

      (p) => !(p.family_id === family_id && p.meal_date === meal_date && p.meal_type === meal_type && p.recipe_id === recipe_id),

    );

    saveDb(state);

  },



  async replace(

    family_id: string,

    meal_date: string,

    meal_type: MealPlan["meal_type"],

    old_recipe_id: string,

    new_recipe_id: string,

  ) {

    if (useMealBackend) {

      unwrapApiData(

        await apiClient.patch("/meal-plans/replace", {

          familyGroupId: family_id,

          meal_date,

          meal_type,

          old_recipe_id,

          new_recipe_id,

        }),

      );

      return;

    }

    await this.remove(family_id, meal_date, meal_type, old_recipe_id);

    await this.add(family_id, meal_date, meal_type, new_recipe_id);

  },



  async markCooked(family_id: string, meal_date: string, meal_type: MealPlan["meal_type"], recipe_id: string, is_cooked: boolean) {

    if (useMealBackend) {

      const result = unwrapApiData<{ can_cook?: boolean; missing?: Array<{ food_name: string; quantity: number; unit: string }> }>(

        await apiClient.patch("/meal-plans/cook", {

          familyGroupId: family_id,

          meal_date,

          meal_type,

          recipe_id,

          is_cooked,

        }),

      );

      if (result?.can_cook === false) {

        const err = Object.assign(new Error("MISSING_INGREDIENTS"), { missing: result.missing ?? [] });

        throw err;

      }

      return;

    }

    // Mock: no-op (is_cooked not stored in mock db)

  },



  async getMissingIngredients(
    family_id: string,
    from: string,
    to: string,
  ): Promise<Array<{ food_name: string; quantity: number; unit: string }>> {
    if (useMealBackend) {
      const data = unwrapApiData<{ missing: Array<{ food_name: string; quantity: number; unit: string }> }>(
        await apiClient.get("/meal-plans/missing-ingredients", {
          params: { familyGroupId: family_id, from, to },
        }),
      );
      return data.missing;
    }
    return [];
  },

  async createShoppingFromPlan(
    family_id: string,
    user_id: string,
    missing: Array<{ food_name: string; quantity: number; unit: string }>,
  ) {
    if (!missing.length) throw new Error("Không có nguyên liệu thiếu để tạo danh sách mua.");
    return shoppingApi.create({
      family_id,
      title: "Nguyên liệu thiếu từ kế hoạch bữa ăn",
      plan_date: todayIso(),
      list_type: "daily",
      created_by: user_id,
      items: missing.map((m) => ({
        food_name: m.food_name,
        quantity: m.quantity,
        unit: m.unit as FoodUnit,
        category: "Khác" as FoodCategory,
      })),
    });
  },

  async autoGenerate(family_id: string, mode: "day" | "week", anchorDate: string, overwrite = false) {
    if (useMealBackend) {
      unwrapApiData(
        await apiClient.post("/meal-plans/auto-generate", {
          familyGroupId: family_id,
          mode,
          date: anchorDate,
          overwrite,
        }),
      );
      return;
    }
  },

  async createShoppingListForMissing(family_id: string, user_id: string, title: string) {

    const suggestions = await recipeApi.suggestions(family_id);

    const missing = suggestions.flatMap((item) => item.missing);

    const unique = new Map<string, { food_name: string; quantity: number; unit: FoodUnit; category: FoodCategory }>();

    missing.forEach((row) => {
      const food_name = row.food.food_name?.trim() || "Nguyên liệu";
      const unit = row.food.unit as FoodUnit;
      const key = `${food_name.toLowerCase()}|${unit || ""}`;
      const current = unique.get(key);
      if (current) {
        current.quantity += Number(row.quantity) || 0;
        return;
      }

      unique.set(key, {
        food_name,
        quantity: Number(row.quantity) || 0,
        unit,
        category: row.food.category as FoodCategory,
      });
    });

    const items = [...unique.values()];

    if (!items.length) throw new Error("Không có nguyên liệu thiếu để tạo danh sách mua.");

    return shoppingApi.create({

      family_id,

      title,

      plan_date: todayIso(),

      list_type: "daily",

      created_by: user_id,

      items,

    });

  },

};

