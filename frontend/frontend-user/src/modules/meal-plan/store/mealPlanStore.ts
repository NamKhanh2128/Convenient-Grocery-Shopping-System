import { create } from "zustand";

import type { MealPlanGroup, RecipeSuggestion } from "@/types";

import type { RecipeDetail } from "@/modules/recipe/api/recipeApi";

import { mealApi } from "@/modules/meal-plan/api/mealApi";

import { recipeApi } from "@/modules/recipe/api/recipeApi";



export type ViewMode = "calendar" | "schedule";

export type MealSlot = "Sáng" | "Trưa" | "Tối";



function getMondayOfWeek(anchor: Date): Date {

  const d = new Date(anchor);

  const day = d.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + diff);

  d.setHours(0, 0, 0, 0);

  return d;

}



function localIso(date: Date): string {

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

}



function getWeekDays(monday: Date): string[] {

  return Array.from({ length: 7 }, (_, i) => {

    const d = new Date(monday);

    d.setDate(d.getDate() + i);

    return localIso(d);

  });

}



interface MealPlanState {

  viewMode: ViewMode;

  weekAnchor: Date;

  weekDays: string[];

  groups: MealPlanGroup[];

  recipes: RecipeDetail[];

  suggestions: RecipeSuggestion[];

  planMissing: Array<{ food_name: string; quantity: number; unit: string }>;

  loading: boolean;

  familyId: string | null;

  editingDate: string | null;

  editingSlot: MealSlot | null;

  setViewMode: (mode: ViewMode) => void;

  loadWeek: (familyId: string, anchor?: Date) => Promise<void>;

  prevWeek: () => void;

  nextWeek: () => void;

  goToCurrentWeek: () => void;

  openEdit: (date: string, slot: MealSlot) => void;

  closeEdit: () => void;

  addRecipeToSlot: (date: string, slot: MealSlot, recipeId: string) => Promise<void>;

  removeRecipeFromSlot: (date: string, slot: MealSlot, recipeId: string) => Promise<void>;

  replaceRecipeInSlot: (date: string, slot: MealSlot, oldRecipeId: string, newRecipeId: string) => Promise<void>;

  markRecipeCooked: (date: string, slot: MealSlot, recipeId: string, isCooked: boolean) => Promise<void>;

  removeSuggestion: (recipeId: string) => void;

  getSlotRecipes: (date: string, slot: MealSlot) => RecipeDetail[];

  isRecipeCooked: (date: string, slot: MealSlot, recipeId: string) => boolean;

  getMissingForRecipe: (recipeId: string) => RecipeSuggestion["missing"];

  createShoppingFromMissing: (familyId: string, userId: string) => Promise<void>;

  createShoppingFromMissingForDate: (familyId: string, userId: string, date: string) => Promise<void>;

  autoGenerateMealPlan: (mode: "day" | "week", overwrite?: boolean) => Promise<void>;

}



export const useMealPlanStore = create<MealPlanState>((set, get) => ({

  viewMode: "calendar",

  weekAnchor: new Date(),

  weekDays: getWeekDays(getMondayOfWeek(new Date())),

  groups: [],

  recipes: [],

  suggestions: [],

  planMissing: [],

  loading: false,

  familyId: null,

  editingDate: null,

  editingSlot: null,



  setViewMode: (mode) => set({ viewMode: mode }),



  loadWeek: async (familyId, anchor) => {

    const base = anchor ?? get().weekAnchor;

    const monday = getMondayOfWeek(base);

    const days = getWeekDays(monday);

    set({ loading: true, weekAnchor: base, weekDays: days, familyId });

    try {

      const [groups, recipes] = await Promise.all([

        mealApi.grouped(familyId, { from: days[0], to: days[6] }),

        recipeApi.list(familyId, undefined, { lite: true }),

      ]);

      set({ groups, recipes, loading: false });

      void recipeApi.suggestions(familyId).then((suggestions) => {

        set({ suggestions });

      }).catch(() => set({ suggestions: [] }));

      // Missing ingredients count from today onward, not already-passed days.
      const today = localIso(new Date());
      const missingFrom = today >= days[0] && today <= days[6] ? today : days[0];
      void mealApi.getMissingIngredients(familyId, missingFrom, days[6]).then((planMissing) => {

        set({ planMissing });

      }).catch(() => set({ planMissing: [] }));

    } catch {

      set({ loading: false });

    }

  },



  prevWeek: () => {

    const { weekAnchor, familyId } = get();

    const prev = new Date(weekAnchor);

    prev.setDate(prev.getDate() - 7);

    if (familyId) void get().loadWeek(familyId, prev);

  },



  nextWeek: () => {

    const { weekAnchor, familyId } = get();

    const next = new Date(weekAnchor);

    next.setDate(next.getDate() + 7);

    if (familyId) void get().loadWeek(familyId, next);

  },



  goToCurrentWeek: () => {

    const { familyId } = get();

    if (familyId) void get().loadWeek(familyId, new Date());

  },



  openEdit: (date, slot) => set({ editingDate: date, editingSlot: slot }),

  closeEdit: () => set({ editingDate: null, editingSlot: null }),



  addRecipeToSlot: async (date, slot, recipeId) => {

    const { familyId } = get();

    if (!familyId) return;

    await mealApi.add(familyId, date, slot, recipeId);

    await get().loadWeek(familyId);

  },



  removeRecipeFromSlot: async (date, slot, recipeId) => {

    const { familyId } = get();

    if (!familyId) return;

    await mealApi.remove(familyId, date, slot, recipeId);

    await get().loadWeek(familyId);

  },



  replaceRecipeInSlot: async (date, slot, oldRecipeId, newRecipeId) => {

    const { familyId } = get();

    if (!familyId) return;

    await mealApi.replace(familyId, date, slot, oldRecipeId, newRecipeId);

    await get().loadWeek(familyId);

  },



  markRecipeCooked: async (date, slot, recipeId, isCooked) => {

    const { familyId } = get();

    if (!familyId) return;

    await mealApi.markCooked(familyId, date, slot, recipeId, isCooked);

    // Optimistic update — toggle cooked_recipe_ids in local state without full reload
    set((state) => ({

      groups: state.groups.map((g) => {

        if (g.meal_date !== date || g.meal_type !== slot) return g;

        const cooked = g.cooked_recipe_ids ?? [];

        return {

          ...g,

          cooked_recipe_ids: isCooked

            ? [...new Set([...cooked, recipeId])]

            : cooked.filter((id) => id !== recipeId),

        };

      }),

    }));

  },



  removeSuggestion: (recipeId) => set((state) => ({

    suggestions: state.suggestions.filter((suggestion) => suggestion.recipe.recipe_id !== recipeId),

  })),



  getSlotRecipes: (date, slot) => {

    const { groups, recipes } = get();

    const group = groups.find((g) => g.meal_date === date && g.meal_type === slot);

    if (!group) return [];

    return group.recipe_ids.map((id) => recipes.find((r) => r.recipe_id === id)).filter(Boolean) as RecipeDetail[];

  },



  isRecipeCooked: (date, slot, recipeId) => {

    const { groups } = get();

    const group = groups.find((g) => g.meal_date === date && g.meal_type === slot);

    return Boolean(group?.cooked_recipe_ids?.includes(recipeId));

  },



  getMissingForRecipe: (recipeId) => {

    const { suggestions } = get();

    return suggestions.find((s) => s.recipe.recipe_id === recipeId)?.missing ?? [];

  },



  createShoppingFromMissing: async (familyId, userId) => {

    const { planMissing } = get();

    await mealApi.createShoppingFromPlan(familyId, userId, planMissing);

    await get().loadWeek(familyId);

  },



  // Used by the per-day detail popup: only the missing ingredients for that
  // single date, not the whole week's planMissing.
  createShoppingFromMissingForDate: async (familyId, userId, date) => {

    const missing = await mealApi.getMissingIngredients(familyId, date, date);

    await mealApi.createShoppingFromPlan(familyId, userId, missing);

    await get().loadWeek(familyId);

  },



  autoGenerateMealPlan: async (mode, overwrite = false) => {

    const { familyId, weekDays } = get();

    if (!familyId) return;
    const today = localIso(new Date());
    // "week" mode starts from today (not Monday) when today is within this week.
    const anchorDate = mode === "week"
      ? (today >= weekDays[0] && today <= weekDays[6] ? today : weekDays[0])
      : today;

    await mealApi.autoGenerate(familyId, mode, anchorDate, overwrite);

    await get().loadWeek(familyId);

  },

}));

