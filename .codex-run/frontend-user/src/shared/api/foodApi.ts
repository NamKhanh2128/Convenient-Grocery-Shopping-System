import { endpoints } from "@/shared/constants/endpoints";
import type { Food } from "@/types";
import { db } from "@/shared/lib/mockDb";

export const foodApi = {
  endpoint: endpoints.foods,
  async list(): Promise<Food[]> {
    const state = await db();
    return [...state.foods].sort((a, b) => a.food_name.localeCompare(b.food_name, "vi"));
  },
};
