import { create } from "zustand";
import { recipeApi, type RecipeDetail, type RecipeListFilters } from "@/modules/recipe/api/recipeApi";

interface RecipeState {
  recipes: RecipeDetail[];
  favorites: RecipeDetail[];
  popular: RecipeDetail[];
  categories: Array<{ id: string; ten: string }>;
  loading: boolean;
  error: string | null;
  search: string;
  timeTag: string;
  privacy: string;

  setSearch: (value: string) => void;
  setTimeTag: (value: string) => void;
  setPrivacy: (value: string) => void;
  load: (familyId: string) => Promise<void>;
  loadPopular: (familyId: string) => Promise<void>;
  loadFavorites: (familyId: string) => Promise<void>;
  remove: (id: string, familyId: string) => Promise<void>;
  toggleFavorite: (id: string, favorite: boolean, familyId?: string) => Promise<void>;
}

function currentFilters(state: RecipeState): RecipeListFilters {
  return {
    search: state.search,
    timeTag: state.timeTag,
    privacy: state.privacy,
  };
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  favorites: [],
  popular: [],
  categories: [],
  loading: false,
  error: null,
  search: "",
  timeTag: "all",
  privacy: "all",

  setSearch: (value) => set({ search: value }),
  setTimeTag: (value) => set({ timeTag: value }),
  setPrivacy: (value) => set({ privacy: value }),

  load: async (familyId) => {
    set({ loading: true, error: null });
    try {
      const filters = currentFilters(get());
      const { recipes, categories } = await recipeApi.listPage(familyId, filters);
      set({ recipes, categories, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Không tải được công thức",
      });
    }
  },

  loadPopular: async (familyId) => {
    try {
      const popular = await recipeApi.popular(familyId, 6);
      set({ popular });
    } catch {
      set({ popular: [] });
    }
  },

  loadFavorites: async (familyId) => {
    set({ loading: true, error: null });
    try {
      const favorites = await recipeApi.listFavorites(familyId);
      set({ favorites, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Không tải được yêu thích",
      });
    }
  },

  remove: async (id, familyId) => {
    await recipeApi.remove(id, familyId);
    set({
      recipes: get().recipes.filter((item) => item.recipe_id !== id),
      favorites: get().favorites.filter((item) => item.recipe_id !== id),
    });
  },

  toggleFavorite: async (id, favorite, familyId) => {
    await recipeApi.toggleFavorite(id, favorite);
    const patch = (item: RecipeDetail) =>
      item.recipe_id === id ? { ...item, is_favorite: favorite } : item;
    set({
      recipes: get().recipes.map(patch),
      favorites: favorite
        ? [...get().favorites, ...get().recipes.filter((r) => r.recipe_id === id).map((r) => ({ ...r, is_favorite: true }))]
            .filter((item, index, arr) => arr.findIndex((x) => x.recipe_id === item.recipe_id) === index)
        : get().favorites.filter((item) => item.recipe_id !== id),
    });
    if (familyId) {
      await get().loadFavorites(familyId);
    }
  },
}));
