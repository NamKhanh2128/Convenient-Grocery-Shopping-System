import { apiClient, unwrapApiData } from "@/shared/api/apiClient";

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
export interface WastedEvent {
  event_id: string;
  food_name: string;
  icon: string;
  quantity: number;
  wasted_date: string;
}
export interface PurchaseTrendDay {
  date: string;
  total: number;
  [category: string]: string | number;
}
export interface PurchaseTrend {
  categories: string[];
  days: PurchaseTrendDay[];
  from: string;
  to: string;
}
export interface FoodQuantityStat {
  food_name: string;
  icon: string;
  category: string;
  unit: string;
  total_quantity: number;
  event_count?: number;
}
export interface ShoppingListStats {
  total: number;
  completed: number;
  active: number;
  cancelled: number;
  completionRate: number;
}

function params(familyId: string) {
  return { params: { familyGroupId: familyId } };
}

export const statisticsApi = {
  async getOverview(family_id: string) {
    return unwrapApiData<{
      totalFridgeItems: number;
      expiredCount: number;
      wastePercentage: number;
      categoryDistribution: CategoryStat[];
      activityCount: number;
      mealPlanCount: number;
      shoppingListCount: number;
    }>(await apiClient.get("/stats/overview", params(family_id)));
  },

  async getDailyActivity(family_id: string): Promise<DailyActivity[]> {
    return unwrapApiData<DailyActivity[]>(
      await apiClient.get("/stats/daily-activity", params(family_id))
    );
  },

  async getCategoryBar(family_id: string): Promise<CategoryStat[]> {
    return unwrapApiData<CategoryStat[]>(
      await apiClient.get("/stats/category-bar", params(family_id))
    );
  },

  async getPurchaseTrend(family_id: string, weekOffset = 0): Promise<PurchaseTrend> {
    return unwrapApiData<PurchaseTrend>(
      await apiClient.get("/stats/purchase-trend", { params: { familyGroupId: family_id, weekOffset } })
    );
  },

  async getConsumptionByFood(family_id: string): Promise<FoodQuantityStat[]> {
    return unwrapApiData<FoodQuantityStat[]>(
      await apiClient.get("/stats/consumption-by-food", params(family_id))
    );
  },

  async getWasteByFood(family_id: string): Promise<FoodQuantityStat[]> {
    return unwrapApiData<FoodQuantityStat[]>(
      await apiClient.get("/stats/waste-by-food", params(family_id))
    );
  },

  async getShoppingListStats(family_id: string): Promise<ShoppingListStats> {
    return unwrapApiData<ShoppingListStats>(
      await apiClient.get("/stats/shopping-list-stats", params(family_id))
    );
  },

  async getFoodTrends(family_id: string): Promise<{ mostUsed: FoodTrend[]; leastUsed: FoodTrend[] }> {
    return unwrapApiData<{ mostUsed: FoodTrend[]; leastUsed: FoodTrend[] }>(
      await apiClient.get("/stats/food-trends", params(family_id))
    );
  },

  async getWasteReport(family_id: string) {
    return unwrapApiData<{
      expiredItems: ExpiredItem[];
      activeCount: number;
      expiredCount: number;
      wasteRatio: number;
      wastedCount: number;
      usedCount: number;
      wastedEvents: WastedEvent[];
    }>(await apiClient.get("/stats/waste-report", params(family_id)));
  },
};
