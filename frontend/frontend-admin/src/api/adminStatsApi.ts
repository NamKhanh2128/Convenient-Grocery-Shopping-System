import { http } from "@/lib/httpClient";

export type SummaryData = {
  totalUsers: number;
  totalAdmins: number;
  totalFoods: number;
  totalRecipes: number;
  totalFamilies: number;
  totalMealPlans: number;
  activeShopping: number;
};

export type FamilyOverview = {
  id: number;
  name: string;
  created_by: number;
  creator_name: string;
  creator_email: string;
  member_count: number;
};

type SummaryResult    = { success: boolean; data: SummaryData };
type ChartResult      = { success: boolean; data: { date: string; count: number }[] };
type CategoryResult   = { success: boolean; data: { name: string; value: number }[] };
type TopRecipeResult  = { success: boolean; data: { name: string; count: number }[] };
type FamiliesResult   = { success: boolean; data: FamilyOverview[] };

export const adminStatsApi = {
  async summary(): Promise<SummaryData> {
    const res = await http.get<SummaryResult>("/api/admin/stats/summary");
    return res.data;
  },

  async mealsByDay(): Promise<{ date: string; count: number }[]> {
    const res = await http.get<ChartResult>("/api/admin/stats/meals-by-day");
    return res.data;
  },

  async foodsByCategory(): Promise<{ name: string; value: number }[]> {
    const res = await http.get<CategoryResult>("/api/admin/stats/foods-by-category");
    return res.data;
  },

  async topRecipes(): Promise<{ name: string; count: number }[]> {
    const res = await http.get<TopRecipeResult>("/api/admin/stats/top-recipes");
    return res.data;
  },

  async getFamilies(): Promise<FamilyOverview[]> {
    const res = await http.get<FamiliesResult>("/api/admin/stats/families");
    return res.data;
  },
};
