/**
 * Single source of truth for DB entity types — must mirror database/supabase/database-schema.md
 * 1:1 (no ghost fields, no legacy aliases, no mock/display-only properties).
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
  image_url: string | null;
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
// UI helper literals — values stored in schema string columns, not column names themselves.
// ─────────────────────────────────────────────────────────────────────────────

/** Valid values for food_categories.name_vi */
export type FoodCategoryLabel =
  | "Rau củ"
  | "Thịt cá"
  | "Đồ khô"
  | "Sữa & Trứng"
  | "Gia vị"
  | "Khác";

/** Valid values for units.name — must match every row seeded in the `units` table exactly. */
export type UnitSymbol = "kg" | "g" | "lít" | "ml" | "quả" | "củ" | "miếng" | "gói" | "hộp" | "bó";

/** Valid values for fridge_items.storage_location */
export type StorageLocation = "Ngăn mát" | "Ngăn đông" | "Kệ thường";

/** Valid values for meal_plan_items.meal_type */
export type MealTypeValue = "breakfast" | "lunch" | "dinner" | "snack";

// ─────────────────────────────────────────────────────────────────────────────
// Do NOT reinstate: UserRole, MealType (Vietnamese variant), FoodCategory/FoodUnit/
// FoodLocation (renamed to *Label/*Symbol/StorageLocation below), Family/FamilyMember
// (renamed FamilyGroup/GroupMember with correct columns), or ghost fields on
// Food/FridgeItem (food_id, family_id, expiry_date, location, etc.) — all removed
// as duplicates or non-schema fields during the ghost-type cleanup.
// ─────────────────────────────────────────────────────────────────────────────
