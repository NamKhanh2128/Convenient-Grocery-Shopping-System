/**
 * frontend-user/src/types/database.ts
 *
 * This file contains TWO sections:
 *
 * ── SECTION A: Schema-Compliant Types ───────────────────────────────────────
 *   Exact 1:1 mirrors of database/supabase/database-schema.md tables.
 *   These are the canonical types for the real backend API.
 *   Naming follows schema column names exactly.
 *
 * ── SECTION B: Mock/Offline Layer Types ─────────────────────────────────────
 *   Legacy types used exclusively by the offline localStorage mockDb layer
 *   (shared/lib/mockDb.ts) and the adapter functions that normalize real API
 *   responses into the shapes the UI components were built around.
 *   These do NOT match the database schema and are intentionally kept for
 *   backward compatibility with the offline-first mockDb layer.
 *   They are labeled with @deprecated where a schema type exists.
 *
 * RULES:
 *  - Never use mock types in new real-API code
 *  - When building new features, use Section A types
 *  - Section B types will be migrated away incrementally
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION A — SCHEMA-COMPLIANT TYPES
// Each interface matches exactly one table in database-schema.md
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// §1  users
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Real schema user type (users table).
 * Used by real backend API responses.
 */
export interface DbUser {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string | null;
  is_locked: boolean | null;
  failed_login_attempts: number | null;
  last_login: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §4  family_groups  (schema table: family_groups)
// ─────────────────────────────────────────────────────────────────────────────
export interface DbFamilyGroup {
  id: number;
  name: string;
  created_by: number;
  created_at: string | null;
  updated_at: string | null;
  code: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §5  group_members  (schema table: group_members)
// ─────────────────────────────────────────────────────────────────────────────
export interface DbGroupMember {
  id: number;
  group_id: number;
  user_id: number;
  joined_at: string | null;
  role: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §7  food_categories
// ─────────────────────────────────────────────────────────────────────────────
export interface DbFoodCategory {
  id: number;
  name_vi: string;
  name_en: string;
  description: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §8  units
// ─────────────────────────────────────────────────────────────────────────────
export interface DbUnit {
  id: number;
  name: string;
  symbol: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §9  foods
// ─────────────────────────────────────────────────────────────────────────────
export interface DbFood {
  id: number;
  food_name: string;
  unit_id: number;
  category_id: number;
  icon: string | null;
  created_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §10  fridge_items
// ─────────────────────────────────────────────────────────────────────────────
export interface DbFridgeItem {
  id: number;
  user_id: number;
  name: string;
  quantity: number;
  unit_id: number;
  category_id: number;
  expiration_date: string;
  storage_location: string | null;
  added_at: string | null;
  updated_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §12  shopping_lists
// ─────────────────────────────────────────────────────────────────────────────
export interface DbShoppingList {
  id: number;
  user_id: number;
  group_id: number | null;
  list_type: string;
  name: string;
  plan_date: string | null;
  status: string | null;
  assigned_user_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §13  shopping_list_items
// ─────────────────────────────────────────────────────────────────────────────
export interface DbShoppingListItem {
  id: number;
  shopping_list_id: number;
  food_id: number | null;
  name: string;
  quantity: number;
  unit_id: number;
  category_id: number;
  is_purchased: boolean | null;
  purchased_by: number | null;
  purchased_at: string | null;
  bought_quantity: number | null;
  remaining_quantity: number | null;
  item_status: string | null;
  inventory_synced_quantity: number | null;
  bought_status: boolean | null;
  created_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §14  recipes
// ─────────────────────────────────────────────────────────────────────────────
export interface DbRecipe {
  id: number;
  name_vi: string;
  name_en: string;
  description: string | null;
  instructions: string;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  created_by: number | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §15  recipe_ingredients
// ─────────────────────────────────────────────────────────────────────────────
export interface DbRecipeIngredient {
  id: number;
  recipe_id: number;
  name: string;
  quantity: number;
  unit_id: number;
  category_id: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §16  meal_plans
// ─────────────────────────────────────────────────────────────────────────────
export interface DbMealPlan {
  id: number;
  user_id: number;
  plan_type: string;
  start_date: string;
  end_date: string;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §17  meal_plan_items
// ─────────────────────────────────────────────────────────────────────────────
export interface DbMealPlanItem {
  id: number;
  meal_plan_id: number;
  recipe_id: number;
  meal_date: string;
  meal_type: string;
  is_cooked: boolean | null;
  created_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §19  notifications
// ─────────────────────────────────────────────────────────────────────────────
export interface DbNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean | null;
  related_id: number | null;
  created_at: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION B — MOCK/OFFLINE LAYER TYPES
// Used by shared/lib/mockDb.ts (localStorage offline layer) and the adapter
// functions inside module APIs that normalize backend responses.
// These do NOT match the database schema but are kept for backward
// compatibility with the offline-first mockDb layer.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Mock type for offline layer only.
 * For real API users use DbUser.
 */
export interface User {
  user_id: string;
  full_name: string;
  email: string;
  password?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  locked?: boolean;
}

/**
 * @deprecated Mock type for offline layer only.
 * For real API foods use DbFood.
 */
export interface Food {
  food_id: string;
  food_name: string;
  category: FoodCategory;
  unit: FoodUnit;
  icon?: string;
}

/**
 * @deprecated Mock type for offline layer only.
 * For real API recipes use DbRecipe.
 */
export interface Recipe {
  recipe_id: string;
  recipe_name: string;
  description: string;
  instructions: string[];
  image_url?: string;
  time_minutes: number;
  calories: number;
  difficulty: string;
  is_favorite?: boolean;
}

/**
 * @deprecated Mock type for offline layer only.
 */
export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  food_id: string;
  quantity: number;
}

/**
 * @deprecated Mock type for offline layer only.
 * For real API family groups use DbFamilyGroup.
 */
export interface Family {
  family_id: string;
  family_name: string;
  family_code?: string;
  created_at?: string;
  created_by?: string;
}

/**
 * @deprecated Mock type for offline layer only.
 * For real API group members use DbGroupMember.
 */
export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
}

/**
 * @deprecated Mock type for offline layer only.
 * Schema: shopping_lists table has id, user_id, group_id, name, list_type — not shopping_list_id/title/family_id.
 * For real API use DbShoppingList.
 */
export interface ShoppingList {
  shopping_list_id: string;
  family_id: string;
  title: string;
  plan_date: string;
  status: ShoppingStatus;
  created_by: string;
  list_type: ShoppingType;
  assigned_user_id?: string;
}

/**
 * @deprecated Mock type for offline layer only.
 * For real API use DbShoppingListItem.
 */
export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  food_id: string;
  quantity: number;
  bought_status: boolean;
  bought_quantity?: number;
  remaining_quantity?: number;
  item_status?: ShoppingItemStatus;
  inventory_synced_quantity?: number;
}

/**
 * @deprecated Mock type for offline layer only.
 * Schema: fridge_items has id, user_id, name, expiration_date, storage_location — not fridge_item_id/family_id/expiry_date/location.
 * For real API use DbFridgeItem.
 */
export interface FridgeItem {
  fridge_item_id: string;
  family_id: string;
  food_id: string;
  quantity: number;
  expiry_date: string;
  location: FoodLocation;
}

/**
 * @deprecated Mock type for offline layer only.
 * Schema: meal_plans has id, user_id, plan_type, start_date, end_date — not meal_plan_id/family_id/meal_date/meal_type/recipe_id.
 * For real API use DbMealPlan + DbMealPlanItem.
 */
export interface MealPlan {
  meal_plan_id: string;
  family_id: string;
  meal_date: string;
  meal_type: MealType;
  recipe_id: string;
}

/**
 * @deprecated Mock/offline UI grouping type — not a database table.
 */
export interface MealPlanGroup {
  family_id: string;
  meal_date: string;
  meal_type: MealType;
  recipe_ids: string[];
}

/**
 * @deprecated Mock type for offline layer only.
 * family_activities is NOT a real database table. This is a mock-only entity.
 */
export interface FamilyActivity {
  id: string;
  family_id: string;
  user_id: string;
  action_type: "shopping" | "fridge" | "meal" | "recipe" | "family";
  message: string;
  created_at: string;
  target?: string;
  quantity?: number;
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth session — application-level type
// ─────────────────────────────────────────────────────────────────────────────
export interface AuthSession {
  token: string;
  refreshToken?: string;
  user: User;
  family: Family | null;
}

/**
 * Recipe suggestion — application-level UI type, not a database table.
 */
export interface RecipeSuggestion {
  recipe: Recipe;
  available_food_ids: string[];
  missing: Array<{ food: Food; quantity: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI helper literals — correspond to string values stored in schema columns
// NOT database column names; kept here for filter/form option lists
// ─────────────────────────────────────────────────────────────────────────────

/** Valid values for users.role */
export type UserRole = "ADMIN" | "USER" | "admin" | "member";

/** Mock shopping list status values (offline layer) */
export type ShoppingStatus = "DRAFT" | "DONE";

/** Mock shopping item status values (offline layer) */
export type ShoppingItemStatus = "PENDING" | "PARTIAL" | "COMPLETED";

/** Mock meal type values used in the offline layer (Vietnamese labels) */
export type MealType = "Sáng" | "Trưa" | "Tối" | "Bữa phụ";

/** Valid values for shopping_lists.list_type */
export type ShoppingType = "daily" | "weekly";

/** Display labels for food_categories.name_vi in offline mock layer */
export type FoodCategory = "Rau củ" | "Thịt cá" | "Đồ khô" | "Sữa & Trứng" | "Gia vị" | "Khác";

/** Display labels for units.symbol in offline mock layer */
export type FoodUnit = "kg" | "g" | "lít" | "ml" | "quả" | "củ" | "miếng" | "gói";

/** Display labels for fridge_items.storage_location in offline mock layer */
export type FoodLocation = "Ngăn mát" | "Ngăn đông" | "Kệ thường";
