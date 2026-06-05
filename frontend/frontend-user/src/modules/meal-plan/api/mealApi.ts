import { apiClient, unwrapApiData } from "@/shared/api/apiClient";

import { endpoints } from "@/shared/constants/endpoints";

import type { FoodCategory, FoodUnit, MealPlan, MealPlanGroup } from "@/types";

import { db, saveDb } from "@/shared/lib/mockDb";

import { recipeApi } from "@/modules/recipe/api/recipeApi";

import { shoppingApi } from "@/modules/shopping/api/shoppingApi";



const useMealBackend = import.meta.env.VITE_USE_MEAL_API !== "false";



type BackendMealPlan = {

  meal_plan_id: string;

  family_id: string;

  meal_date: string;

  meal_type: MealPlan["meal_type"];

  recipe_id: string;

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

      });

    }

    map.get(key)!.recipe_ids.push(row.recipe_id);

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



  async createShoppingListForMissing(family_id: string, user_id: string, title: string) {

    const suggestions = await recipeApi.suggestions(family_id);

    const missing = suggestions.flatMap((item) => item.missing);

    const unique = new Map(missing.map((row) => [row.food.food_id, row]));

    const items = [...unique.values()].map((row) => {
      const food_name = row.food.food_name?.trim() || "Nguyên liệu";
      if (/^\d+$/.test(row.food.food_id)) {
        return { food_id: row.food.food_id, food_name, quantity: row.quantity };
      }
      return {
        food_name,
        quantity: row.quantity,
        unit: row.food.unit as FoodUnit,
        category: row.food.category as FoodCategory,
      };
    });

    if (!items.length) throw new Error("Không có nguyên liệu thiếu để tạo danh sách mua.");

    return shoppingApi.create({

      family_id,

      title,

      plan_date: new Date().toISOString().slice(0, 10),

      list_type: "daily",

      created_by: user_id,

      items,

    });

  },

};

