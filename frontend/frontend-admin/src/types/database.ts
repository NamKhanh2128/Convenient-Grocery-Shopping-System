/**
 * frontend-admin/src/types/database.ts
 *
 * SINGLE SOURCE OF TRUTH for all database entity TypeScript types in the admin frontend.
 * Every interface here corresponds 1:1 to a table in database/supabase/database-schema.md.
 *
 * RULES:
 *  - No ghost types (columns that do not exist in the schema)
 *  - No legacy aliases (family_id → id, family_name → name, etc.)
 *  - No mock/localStorage properties
 *  - No invented fields (calories, difficulty, avatar_url, recipe_name, food_name_alias, etc.)
 *  - If a value is only needed for display (joined from another table), it must NOT appear here;
 *    it belongs in the API's `*WithMeta` / `*Summary` extension types.
 *
 * Tables covered (matches schema table list order):
 *  1.  users
 *  2.  roles
 *  3.  refresh_tokens
 *  4.  family_groups
 *  5.  group_members
 *  6.  family_invitations
 *  7.  food_categories
 *  8.  units
 *  9.  foods
 *  10. fridge_items
 *  11. fridge_item_storage_locations
 *  12. shopping_lists
 *  13. shopping_list_items
 *  14. recipes
 *  15. recipe_ingredients
 *  16. meal_plans
 *  17. meal_plan_items
 *  18. favorite_recipes
 *  19. notifications
 *  20. danh_muc_cong_thuc
 */

// ─────────────────────────────────────────────────────────────────────────────
// §1  users
// ─────────────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  /** password_hash is server-only; never returned to frontend */
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
// §2  roles
// ─────────────────────────────────────────────────────────────────────────────
export interface Role {
  role_id: number;
  role_name: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3  refresh_tokens
// ─────────────────────────────────────────────────────────────────────────────
export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  created_at: string;
  expires_at: string;
  revoked: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// §4  family_groups  (was: "Family" with ghost fields family_id, family_name)
// ─────────────────────────────────────────────────────────────────────────────
export interface FamilyGroup {
  id: number;
  name: string;
  created_by: number;
  created_at: string | null;
  updated_at: string | null;
  code: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §5  group_members  (was: "FamilyMember" with ghost field family_id)
// ─────────────────────────────────────────────────────────────────────────────
export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  joined_at: string | null;
  role: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §6  family_invitations
// ─────────────────────────────────────────────────────────────────────────────
export interface FamilyInvitation {
  id: number;
  group_id: number;
  inviter_user_id: number;
  invited_user_id: number;
  status: string;
  created_at: string | null;
  responded_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §7  food_categories  (was: "IngredientCategory" — same table, renamed)
// ─────────────────────────────────────────────────────────────────────────────
export interface FoodCategory {
  id: number;
  name_vi: string;
  name_en: string;
  description: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §8  units
// ─────────────────────────────────────────────────────────────────────────────
export interface Unit {
  id: number;
  name: string;
  symbol: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §9  foods  (was: Food with ghost fields food_id, category string, unit string)
// ─────────────────────────────────────────────────────────────────────────────
export interface Food {
  id: number;
  food_name: string;
  unit_id: number;
  category_id: number;
  icon: string | null;
  created_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §10  fridge_items  (was: FridgeItem with ghost fields fridge_item_id, family_id, expiry_date, location)
// ─────────────────────────────────────────────────────────────────────────────
export interface FridgeItem {
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
// §11  fridge_item_storage_locations
// ─────────────────────────────────────────────────────────────────────────────
export interface FridgeItemStorageLocation {
  chi_tiet_id: number;
  storage_location: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §12  shopping_lists
// ─────────────────────────────────────────────────────────────────────────────
export interface ShoppingList {
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
export interface ShoppingListItem {
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
export interface Recipe {
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
export interface RecipeIngredient {
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
export interface MealPlan {
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
export interface MealPlanItem {
  id: number;
  meal_plan_id: number;
  recipe_id: number;
  meal_date: string;
  meal_type: string;
  is_cooked: boolean | null;
  created_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §18  favorite_recipes
// ─────────────────────────────────────────────────────────────────────────────
export interface FavoriteRecipe {
  id: number;
  user_id: number;
  recipe_id: number;
  created_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §19  notifications
// ─────────────────────────────────────────────────────────────────────────────
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean | null;
  related_id: number | null;
  created_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §20  danh_muc_cong_thuc  (was: RecipeCategory — same table, kept Vietnamese naming per schema)
// ─────────────────────────────────────────────────────────────────────────────
export interface RecipeCategory {
  danh_muc_cong_thuc_id: number;
  ten_danh_muc: string;
  mo_ta: string | null;
  ngay_tao: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth session — application-level type, NOT a database table
// ─────────────────────────────────────────────────────────────────────────────
export interface AuthSession {
  token: string;
  user: User;
  /** Family group the admin belongs to, if any */
  family: FamilyGroup | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI helper literals — NOT database columns; used only as filter/form options
// These correspond to the values stored IN schema string columns, not to column
// names themselves. They are kept here for convenience but should NOT be used as
// property keys on entity objects.
// ─────────────────────────────────────────────────────────────────────────────

/** Valid values for food_categories.name_vi */
export type FoodCategoryLabel =
  | "Rau củ"
  | "Thịt cá"
  | "Đồ khô"
  | "Sữa & Trứng"
  | "Gia vị"
  | "Khác";

/** Valid values for units.symbol */
export type UnitSymbol = "kg" | "g" | "lít" | "ml" | "quả" | "củ" | "miếng" | "gói";

/** Valid values for fridge_items.storage_location */
export type StorageLocation = "Ngăn mát" | "Ngăn đông" | "Kệ thường";

/** Valid values for meal_plan_items.meal_type */
export type MealTypeValue = "breakfast" | "lunch" | "dinner" | "snack";

// ─────────────────────────────────────────────────────────────────────────────
// DEPRECATED / REMOVED ghost types — kept as comments so consumers know what
// changed and why. Do NOT reinstate these.
//
//  ❌ type UserRole = "ADMIN" | "USER"
//      → users.role is a free string column in schema; use string literal narrowing in code.
//
//  ❌ type MealType = "Sáng" | "Trưa" | ...
//      → schema uses English values: breakfast/lunch/dinner/snack (meal_plan_items.meal_type)
//
//  ❌ type FoodCategory = "Rau củ" | ...
//      → renamed FoodCategoryLabel; this is a display value, not a schema column name
//
//  ❌ type FoodUnit = "kg" | "g" | ...
//      → renamed UnitSymbol; corresponds to units.symbol, not a schema column name
//
//  ❌ type FoodLocation = "Ngăn mát" | ...
//      → renamed StorageLocation; corresponds to fridge_items.storage_location value
//
//  ❌ interface Family { family_id, family_name, created_by }
//      → replaced by FamilyGroup with correct schema column names: id, name, created_by, code
//
//  ❌ interface FamilyMember { id, family_id, user_id }
//      → replaced by GroupMember with correct column names: id, group_id, user_id, joined_at, role
//
//  ❌ interface Food { food_id, food_name, category: FoodCategory, unit: FoodUnit, icon }
//      → ghost fields food_id (→ id), category string (→ category_id FK), unit string (→ unit_id FK)
//
//  ❌ interface FridgeItem { fridge_item_id, family_id, food_id, expiry_date, location }
//      → ghost fields fridge_item_id (→ id), family_id (→ user_id), expiry_date (→ expiration_date),
//        location (→ storage_location). food_id is not a column in fridge_items.
//
//  ❌ interface IngredientCategory { id, name_vi, name_en, description }
//      → duplicate of FoodCategory (same table food_categories); removed, use FoodCategory.
//
//  ❌ interface RecipeSuggestion { recipe: Recipe; available_food_ids; missing }
//      → application-level UI model, not a schema entity; removed from canonical types.
//        Use it as a local type in the page/component that needs it.
// ─────────────────────────────────────────────────────────────────────────────
