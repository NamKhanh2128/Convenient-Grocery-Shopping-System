import { db } from "@/shared/lib/mockDb";

export interface DailyActivity { date: string; count: number }
export interface CategoryStat { category: string; count: number }
export interface FoodTrend {
  food_id: string;
  food_name: string;
  icon: string;
  category: string;
  count: number;
  inFridge: boolean;
}
export interface ExpiredItem {
  fridge_item_id: string;
  food_name: string;
  icon: string;
  quantity: number;
  expiry_date: string;
  location: string;
}

export const statisticsApi = {
  async getOverview(family_id: string) {
    const state = await db();
    const fridgeItems = state.fridge_items.filter((i) => i.family_id === family_id);
    const today = new Date().toISOString().slice(0, 10);
    const expiredCount = fridgeItems.filter((i) => i.expiry_date < today).length;
    const wastePercentage = fridgeItems.length > 0 ? Math.round((expiredCount / fridgeItems.length) * 100) : 0;

    const categoryMap: Record<string, number> = {};
    fridgeItems.forEach((item) => {
      const food = state.foods.find((f) => f.food_id === item.food_id);
      if (food) categoryMap[food.category] = (categoryMap[food.category] ?? 0) + 1;
    });
    const categoryDistribution: CategoryStat[] = Object.entries(categoryMap).map(([category, count]) => ({ category, count }));

    const activities = state.family_activities.filter((a) => a.family_id === family_id);
    return {
      totalFridgeItems: fridgeItems.length,
      expiredCount,
      wastePercentage,
      categoryDistribution,
      activityCount: activities.length,
      mealPlanCount: state.meal_plans.filter((mp) => mp.family_id === family_id).length,
      shoppingListCount: state.shopping_lists.filter((sl) => sl.family_id === family_id).length,
    };
  },

  async getDailyActivity(family_id: string): Promise<DailyActivity[]> {
    const state = await db();
    const activities = state.family_activities.filter((a) => a.family_id === family_id);
    const dateMap: Record<string, number> = {};
    activities.forEach((a) => {
      const date = a.created_at.slice(0, 10);
      dateMap[date] = (dateMap[date] ?? 0) + 1;
    });
    const days: DailyActivity[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ date: dateStr.slice(5), count: dateMap[dateStr] ?? Math.floor(Math.random() * 4) });
    }
    return days;
  },

  async getCategoryBar(family_id: string): Promise<CategoryStat[]> {
    const state = await db();
    const fridgeItems = state.fridge_items.filter((i) => i.family_id === family_id);
    const map: Record<string, number> = {};
    fridgeItems.forEach((item) => {
      const food = state.foods.find((f) => f.food_id === item.food_id);
      if (food) map[food.category] = (map[food.category] ?? 0) + item.quantity;
    });
    return Object.entries(map).map(([category, count]) => ({ category, count }));
  },

  async getFoodTrends(family_id: string): Promise<{ mostUsed: FoodTrend[]; leastUsed: FoodTrend[] }> {
    const state = await db();
    const mealPlans = state.meal_plans.filter((mp) => mp.family_id === family_id);
    const fridgeItems = state.fridge_items.filter((i) => i.family_id === family_id);
    const foodUsage: Record<string, number> = {};
    mealPlans.forEach((mp) => {
      state.recipe_ingredients
        .filter((ri) => ri.recipe_id === mp.recipe_id)
        .forEach((ri) => { foodUsage[ri.food_id] = (foodUsage[ri.food_id] ?? 0) + 1; });
    });
    const trends: FoodTrend[] = state.foods.map((food) => ({
      food_id: food.food_id,
      food_name: food.food_name,
      icon: food.icon ?? "🍽️",
      category: food.category,
      count: foodUsage[food.food_id] ?? 0,
      inFridge: fridgeItems.some((fi) => fi.food_id === food.food_id),
    }));
    return {
      mostUsed: [...trends].sort((a, b) => b.count - a.count).slice(0, 6),
      leastUsed: trends.filter((f) => f.count === 0).slice(0, 6),
    };
  },

  async getWasteReport(family_id: string) {
    const state = await db();
    const fridgeItems = state.fridge_items.filter((i) => i.family_id === family_id);
    const today = new Date().toISOString().slice(0, 10);
    const expired: ExpiredItem[] = fridgeItems
      .filter((i) => i.expiry_date < today)
      .map((i) => {
        const food = state.foods.find((f) => f.food_id === i.food_id);
        return { fridge_item_id: i.fridge_item_id, food_name: food?.food_name ?? "?", icon: food?.icon ?? "🍽️", quantity: i.quantity, expiry_date: i.expiry_date, location: i.location };
      });
    const activeCount = fridgeItems.filter((i) => i.expiry_date >= today).length;
    return { expiredItems: expired, activeCount, expiredCount: expired.length, wasteRatio: fridgeItems.length > 0 ? Math.round((expired.length / fridgeItems.length) * 100) : 0 };
  },
};
