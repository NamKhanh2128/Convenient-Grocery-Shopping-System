import { apiClient, unwrapApiData } from "@/shared/api/apiClient";
import { endpoints } from "@/shared/constants/endpoints";
import { shoppingApi, type ShoppingCreateItem, type ShoppingListDetail } from "@/modules/shopping/api/shoppingApi";
import type { Food, FoodCategory, FoodUnit, Recipe, RecipeIngredient, RecipeSuggestion } from "@/types";
import { todayIso } from "@/shared/utils/date";

export function missingToShoppingItems(
  missing: RecipeSuggestion["missing"],
): ShoppingCreateItem[] {
  return missing.map((row) => {
    const food_name = row.food.food_name?.trim() || "Nguyên liệu";
    if (/^\d+$/.test(row.food.food_id)) {
      return { food_id: row.food.food_id, food_name, quantity: row.quantity };
    }
    return {
      food_name,
      quantity: row.quantity,
      unit: row.food.unit,
      category: row.food.category,
    };
  });
}

export type RecipeDetail = Recipe & {
  loai_quyen?: "SYSTEM" | "PRIVATE" | "FAMILY";
  danh_muc_id?: string | null;
  danh_muc_ten?: string | null;
  khau_phan?: number;
  ingredient_count?: number;
  cook_count?: number;
  ingredients: Array<RecipeIngredient & { food: Food }>;
};

export type RecipeListFilters = {
  search?: string;
  timeTag?: string;
  privacy?: string;
};

type BackendIngredient = {
  id: string;
  ten_nguyen_lieu: string;
  so_luong: number | null;
  don_vi: string | null;
  thuc_pham_id: string | null;
  ten_thuc_pham: string | null;
};

type BackendRecipe = {
  id: string;
  tieu_de: string;
  mo_ta: string;
  huong_dan: string;
  instructions?: string[];
  thoi_gian_phut: number;
  khau_phan: number;
  calories?: number;
  do_kho?: string;
  hinh_anh_url: string;
  loai_quyen: "SYSTEM" | "PRIVATE" | "FAMILY";
  danh_muc: { id: string; ten: string | null } | null;
  da_yeu_thich?: boolean;
  ingredient_count?: number;
  cook_count?: number;
  nguyen_lieu: BackendIngredient[];
};

type ListResponse = {
  recipes: BackendRecipe[];
  categories: Array<{ id: string; ten: string }>;
};

type DetailResponse = {
  recipe: BackendRecipe;
};

type SuggestResponse = {
  suggestions: Array<{
    recipe: BackendRecipe;
    available_food_ids: string[];
    missing: Array<{
      food_id: string;
      food_name: string;
      quantity: number;
      unit: string;
    }>;
  }>;
};

type MissingResponse = {
  recipe: BackendRecipe;
  missing: Array<{
    food_id: string;
    food_name: string;
    quantity: number;
    unit: string;
  }>;
  available_food_ids: string[];
};

function extractApiError(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  if (error instanceof Error) return error.message;
  return "Yêu cầu API thất bại.";
}

function toFoodUnit(unit: string | null | undefined): FoodUnit {
  const allowed: FoodUnit[] = ["kg", "g", "lít", "ml", "quả", "củ", "miếng", "gói"];
  if (unit && allowed.includes(unit as FoodUnit)) return unit as FoodUnit;
  return "g";
}

function toFoodCategory(name: string | null | undefined): FoodCategory {
  const map: Record<string, FoodCategory> = {
    "Rau củ": "Rau củ",
    "Thịt cá": "Thịt cá",
    "Đồ khô": "Đồ khô",
    "Sữa & Trứng": "Sữa & Trứng",
    "Gia vị": "Gia vị",
  };
  return map[name || ""] || "Khác";
}

function toRecipeDetail(recipe: BackendRecipe | null | undefined): RecipeDetail {
  if (!recipe?.id) {
    throw new Error("Không nhận được dữ liệu công thức từ server.");
  }
  const recipeId = String(recipe.id);
  return {
    recipe_id: recipeId,
    recipe_name: recipe.tieu_de,
    description: recipe.mo_ta || "",
    instructions: recipe.instructions?.length
      ? recipe.instructions
      : (recipe.huong_dan || "").split(/\r?\n/).map((s) => s.replace(/^\d+[\).\s-]+/, "").trim()).filter(Boolean),
    image_url: recipe.hinh_anh_url || "",
    time_minutes: recipe.thoi_gian_phut || 30,
    khau_phan: recipe.khau_phan ?? 2,
    ingredient_count: recipe.ingredient_count ?? recipe.nguyen_lieu?.length ?? 0,
    cook_count: recipe.cook_count ?? 0,
    calories: recipe.calories ?? Math.max(150, (recipe.ingredient_count ?? recipe.nguyen_lieu?.length ?? 0) * 80),
    difficulty: recipe.do_kho || "Trung bình",
    is_favorite: recipe.da_yeu_thich ?? false,
    loai_quyen: recipe.loai_quyen,
    danh_muc_id: recipe.danh_muc?.id ?? null,
    danh_muc_ten: recipe.danh_muc?.ten ?? null,
    ingredients: (recipe.nguyen_lieu || []).map((item) => {
      const foodId = item.thuc_pham_id || `food-${item.id}`;
      const foodName = item.ten_thuc_pham || item.ten_nguyen_lieu;
      return {
        id: String(item.id),
        recipe_id: recipeId,
        food_id: foodId,
        quantity: Number(item.so_luong) || 0,
        food: {
          food_id: foodId,
          food_name: foodName,
          category: toFoodCategory(recipe.danh_muc?.ten),
          unit: toFoodUnit(item.don_vi),
          icon: "🍽️",
        },
      };
    }),
  };
}

function toRecipe(recipe: BackendRecipe): Recipe {
  const detail = toRecipeDetail(recipe);
  const { ingredients: _ingredients, ...base } = detail;
  return base;
}

function buildListParams(
  familyId?: string,
  filters?: RecipeListFilters,
  options?: { lite?: boolean },
) {
  const params: Record<string, string> = {};
  if (familyId) params.familyGroupId = familyId;
  if (filters?.search?.trim()) params.search = filters.search.trim();
  if (filters?.timeTag && filters.timeTag !== "all") params.timeTag = filters.timeTag;
  if (filters?.privacy && filters.privacy !== "all") params.privacy = filters.privacy;
  if (options?.lite !== false) params.lite = "true";
  return { params };
}

export const recipeApi = {
  endpoint: endpoints.recipes,

  async listPage(
    familyId?: string,
    filters?: RecipeListFilters,
  ): Promise<{ recipes: RecipeDetail[]; categories: Array<{ id: string; ten: string }> }> {
    const data = unwrapApiData<ListResponse>(
      await apiClient.get("/recipes", buildListParams(familyId, filters, { lite: true })),
    );
    return {
      recipes: data.recipes.map(toRecipeDetail),
      categories: data.categories,
    };
  },

  async list(familyId?: string, filters?: RecipeListFilters, options?: { lite?: boolean }): Promise<RecipeDetail[]> {
    const data = unwrapApiData<ListResponse>(
      await apiClient.get("/recipes", buildListParams(familyId, filters, options)),
    );
    return data.recipes.map(toRecipeDetail);
  },

  async listPublic(): Promise<RecipeDetail[]> {
    const data = unwrapApiData<ListResponse>(
      await apiClient.get("/recipes/public", { params: { lite: "true" } }),
    );
    return data.recipes.map(toRecipeDetail);
  },

  async listFavorites(familyId?: string): Promise<RecipeDetail[]> {
    const data = unwrapApiData<{ recipes: BackendRecipe[] }>(
      await apiClient.get("/recipes/favorites", familyId ? { params: { familyGroupId: familyId } } : {}),
    );
    return data.recipes.map(toRecipeDetail);
  },

  async popular(familyId?: string, limit = 5): Promise<RecipeDetail[]> {
    const data = unwrapApiData<{ recipes: BackendRecipe[] }>(
      await apiClient.get("/recipes/popular", {
        params: { familyGroupId: familyId, limit },
      }),
    );
    return data.recipes.map(toRecipeDetail);
  },

  async categories(familyId?: string): Promise<Array<{ id: string; ten: string }>> {
    const { categories } = await this.listPage(familyId);
    return categories;
  },

  async detail(recipe_id: string, familyId?: string): Promise<RecipeDetail> {
    const data = unwrapApiData<DetailResponse>(
      await apiClient.get(`/recipes/${recipe_id}`, familyId ? { params: { familyGroupId: familyId } } : {}),
    );
    return toRecipeDetail(data.recipe);
  },

  async suggestions(family_id: string): Promise<RecipeSuggestion[]> {
    const data = unwrapApiData<SuggestResponse>(
      await apiClient.get("/recipes/suggest/from-fridge", {
        params: { familyGroupId: family_id, limit: 15 },
      }),
    );
    return data.suggestions.map((item) => ({
      recipe: toRecipe(item.recipe),
      available_food_ids: item.available_food_ids,
      missing: item.missing.map((m) => ({
        food: {
          food_id: m.food_id,
          food_name: m.food_name,
          category: "Khác" as FoodCategory,
          unit: toFoodUnit(m.unit),
          icon: "🛒",
        },
        quantity: m.quantity,
      })),
    }));
  },

  async getMissing(recipeId: string, familyId: string) {
    const data = unwrapApiData<MissingResponse>(
      await apiClient.get(`/recipes/${recipeId}/missing-ingredients`, {
        params: { familyGroupId: familyId },
      }),
    );
    return {
      recipe: toRecipeDetail(data.recipe),
      available_food_ids: data.available_food_ids || [],
      missing: data.missing.map((m) => ({
        food: {
          food_id: m.food_id,
          food_name: m.food_name,
          category: "Khác" as FoodCategory,
          unit: toFoodUnit(m.unit),
          icon: "🛒",
        },
        quantity: m.quantity,
      })),
    };
  },

  async create(
    payload: {
      tieu_de: string;
      mo_ta?: string;
      huong_dan: string;
      thoi_gian_phut?: number;
      khau_phan?: number;
      hinh_anh_url?: string;
      danh_muc_id?: string;
      loai_quyen?: "PRIVATE" | "FAMILY";
      nguyen_lieu: Array<{ ten_nguyen_lieu: string; so_luong?: number; don_vi?: string; thuc_pham_id?: string }>;
    },
    familyId?: string,
  ): Promise<RecipeDetail> {
    const data = unwrapApiData<DetailResponse>(
      await apiClient.post("/recipes", { ...payload, familyGroupId: familyId }),
    );
    return toRecipeDetail(data.recipe);
  },

  async update(
    id: string,
    payload: Partial<{
      tieu_de: string;
      mo_ta: string;
      huong_dan: string;
      thoi_gian_phut: number;
      khau_phan: number;
      hinh_anh_url: string;
      danh_muc_id: string;
      loai_quyen: "PRIVATE" | "FAMILY";
      nguyen_lieu: Array<{ ten_nguyen_lieu: string; so_luong?: number; don_vi?: string; thuc_pham_id?: string }>;
    }>,
    familyId?: string,
  ): Promise<RecipeDetail> {
    const data = unwrapApiData<DetailResponse>(
      await apiClient.put(`/recipes/${id}`, { ...payload, familyGroupId: familyId }),
    );
    return toRecipeDetail(data.recipe);
  },

  async remove(id: string, familyId?: string): Promise<void> {
    unwrapApiData(
      await apiClient.delete(`/recipes/${id}`, familyId ? { params: { familyGroupId: familyId } } : {}),
    );
  },

  async toggleFavorite(id: string, favorite: boolean): Promise<void> {
    if (favorite) {
      unwrapApiData(await apiClient.post(`/recipes/${id}/favorite`));
    } else {
      unwrapApiData(await apiClient.delete(`/recipes/${id}/favorite`));
    }
  },

  async markCooked(family_id: string, recipe_id: string): Promise<void> {
    try {
      unwrapApiData(
        await apiClient.post(
          `/recipes/${recipe_id}/mark-cooked`,
          { familyGroupId: family_id },
          { params: { familyGroupId: family_id } },
        ),
      );
    } catch (error) {
      throw new Error(extractApiError(error));
    }
  },

  async createShoppingList(
    recipe_id: string,
    family_id: string,
    user_id: string,
    title?: string,
    recipeName?: string,
    missing?: RecipeSuggestion["missing"],
  ): Promise<ShoppingListDetail> {
    try {
      let items = missing?.length ? missingToShoppingItems(missing) : [];
      if (!items.length) {
        const data = await this.getMissing(recipe_id, family_id);
        items = missingToShoppingItems(data.missing);
      }
      if (!items.length) {
        throw new Error("Không thiếu nguyên liệu để tạo danh sách mua.");
      }
      return await shoppingApi.create({
        family_id,
        title: title || `Mua thêm cho: ${recipeName || "công thức"}`,
        plan_date: todayIso(),
        list_type: "daily",
        created_by: user_id,
        items,
      });
    } catch (error) {
      throw new Error(extractApiError(error));
    }
  },
};
