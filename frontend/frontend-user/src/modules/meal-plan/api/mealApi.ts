import { endpoints } from "@/shared/constants/endpoints";
import type { MealPlanGroup } from "@/types";
import { uid } from "@/shared/utils/storage";
import { addActivity, db, saveDb } from "@/shared/lib/mockDb";
import { recipeApi } from "@/modules/recipe/api/recipeApi";
import { apiClient } from "@/shared/lib/apiClient";

const slotToType: Record<string, string> = {
  'Sáng': 'breakfast',
  'Trưa': 'lunch',
  'Tối': 'dinner'
};

const typeToSlot: Record<string, string> = {
  'breakfast': 'Sáng',
  'lunch': 'Trưa',
  'dinner': 'Tối'
};

export const mealApi = {
  endpoint: endpoints.mealPlans,
  
  async grouped(family_id: string): Promise<MealPlanGroup[]> {
    try {
      const { data } = await apiClient.get('/meal-plans');
      const plans = data.data || [];
      
      const map = new Map<string, MealPlanGroup>();
      plans.forEach((plan: any) => {
        plan.items?.forEach((item: any) => {
          // Format date string to avoid timezone issues (UTC to Local)
          const d = new Date(item.meal_date);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          
          const mappedSlot = typeToSlot[item.meal_type] || item.meal_type;
          const key = `${dateStr}-${mappedSlot}`;
          
          if (!map.has(key)) {
            map.set(key, { family_id, meal_date: dateStr, meal_type: mappedSlot, recipe_ids: [] });
          }
          map.get(key)!.recipe_ids.push(String(item.recipe_id));
        });
      });
      console.log("[mealApi.grouped] Raw Plans:", plans);
      console.log("[mealApi.grouped] Mapped Groups:", [...map.values()]);
      return [...map.values()];
    } catch (e) {
      console.error("Failed to fetch meal plans from backend", e);
      return [];
    }
  },

  async addRecipeToSlot(family_id: string, date: string, slot: string, recipeId: number) {
    const mappedType = slotToType[slot] || slot;
    await apiClient.post('/meal-plans', {
      plan_type: 'daily',
      start_date: date,
      end_date: date,
      items: [
        { recipe_id: recipeId, meal_date: date, meal_type: mappedType }
      ]
    });
  },

  async removeRecipeFromSlot(family_id: string, date: string, slot: string, recipeId: number) {
    const mappedType = slotToType[slot] || slot;
    const { data } = await apiClient.get('/meal-plans');
    const plans = data.data || [];
    
    for (const plan of plans) {
      if (plan.items) {
        const itemToRemove = plan.items.find((i: any) => {
          const d = new Date(i.meal_date);
          const itemDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return itemDate === date && i.meal_type === mappedType && i.recipe_id === recipeId;
        });
        if (itemToRemove) {
          await apiClient.delete(`/meal-plans/${plan.id}`);
        }
      }
    }
  },

  async replaceRecipeInSlot(family_id: string, date: string, slot: string, oldRecipeId: number, newRecipeId: number) {
    await this.removeRecipeFromSlot(family_id, date, slot, oldRecipeId);
    await this.addRecipeToSlot(family_id, date, slot, newRecipeId);
  },

  async createShoppingListForMissing(family_id: string, user_id: string, title: string) {
    // Keep using mockDb for shopping list since it's not migrated to backend yet
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
