// COPIED AND ADAPTED from src/shared/lib/mockDb.ts
// ⚠️ CRITICAL: DB_KEY and SESSION_KEY MUST match user frontend exactly
// This ensures admin and user frontend share the same localStorage data
//
// NOTE: The types below are intentionally LOCAL to this file (prefixed `Mock*`)
// and are NOT exported from `@/types` (frontend-admin/src/types/database.ts).
// `database.ts` mirrors `database/supabase/database-schema.md` 1:1 for the real
// backend admin APIs; this file is a self-contained localStorage mock layer used
// only for the admin app's login session chrome and notification bell, and its
// shapes intentionally do not correspond to schema tables.

import { addDaysIso, todayIso } from "@/lib/date";
import { storage, uid, wait } from "@/lib/storage";

export interface MockUser {
  user_id: string;
  full_name: string;
  email: string;
  password?: string;
  phone?: string;
  role: "ADMIN" | "USER";
  locked?: boolean;
}

export interface MockFood {
  food_id: string;
  food_name: string;
  category: string;
  unit: string;
  icon?: string;
}

export interface MockRecipe {
  recipe_id: string;
  recipe_name: string;
  description: string;
  instructions: string[];
  time_minutes: number;
  calories: number;
  difficulty: string;
  is_favorite?: boolean;
}

export interface MockRecipeIngredient {
  id: string;
  recipe_id: string;
  food_id: string;
  quantity: number;
}

export interface MockFamily {
  family_id: string;
  family_name: string;
  created_by: string;
}

export interface MockFamilyMember {
  id: string;
  family_id: string;
  user_id: string;
}

export interface MockShoppingList {
  shopping_list_id: string;
  family_id: string;
  title: string;
  plan_date: string;
  status: string;
  created_by: string;
  list_type: string;
  assigned_user_id?: string;
}

export interface MockShoppingListItem {
  id: string;
  shopping_list_id: string;
  food_id: string;
  quantity: number;
  bought_status: boolean;
  bought_quantity?: number;
  remaining_quantity?: number;
  item_status?: string;
  inventory_synced_quantity?: number;
}

export interface MockFridgeItem {
  fridge_item_id: string;
  family_id: string;
  food_id: string;
  quantity: number;
  expiry_date: string;
  location: string;
}

export interface MockMealPlan {
  meal_plan_id: string;
  family_id: string;
  meal_date: string;
  meal_type: string;
  recipe_id: string;
}

export interface MockFamilyActivity {
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

type Db = {
  users: MockUser[];
  foods: MockFood[];
  recipes: MockRecipe[];
  recipe_ingredients: MockRecipeIngredient[];
  families: MockFamily[];
  family_members: MockFamilyMember[];
  shopping_lists: MockShoppingList[];
  shopping_list_items: MockShoppingListItem[];
  fridge_items: MockFridgeItem[];
  meal_plans: MockMealPlan[];
  family_activities: MockFamilyActivity[];
};

// ⚠️ MUST match user frontend exactly
export const DB_KEY = "nateat.db.v2";
export const SESSION_KEY = "nateat.session";

const now = () => new Date().toISOString();

function initialDb(): Db {
  const family_id = "family-1";
  const user_id = "user-1";
  const foods: MockFood[] = [
    { food_id: "food-beef", food_name: "Thịt bò", category: "Thịt cá", unit: "g", icon: "🥩" },
    { food_id: "food-tomato", food_name: "Cà chua", category: "Rau củ", unit: "quả", icon: "🍅" },
    { food_id: "food-onion", food_name: "Hành tây", category: "Rau củ", unit: "củ", icon: "🧅" },
    { food_id: "food-garlic", food_name: "Tỏi", category: "Gia vị", unit: "gói", icon: "🧄" },
    { food_id: "food-milk", food_name: "Sữa tươi", category: "Sữa & Trứng", unit: "lít", icon: "🥛" },
    { food_id: "food-egg", food_name: "Trứng gà", category: "Sữa & Trứng", unit: "quả", icon: "🥚" },
    { food_id: "food-fish", food_name: "Cá lóc", category: "Thịt cá", unit: "kg", icon: "🐟" },
    { food_id: "food-noodle", food_name: "Phở khô", category: "Đồ khô", unit: "gói", icon: "🍜" },
    { food_id: "food-rice", food_name: "Gạo", category: "Đồ khô", unit: "kg", icon: "🌾" },
    { food_id: "food-tofu", food_name: "Đậu phụ", category: "Đồ khô", unit: "miếng", icon: "🟨" },
    { food_id: "food-chili", food_name: "Ớt sừng", category: "Gia vị", unit: "quả", icon: "🌶️" },
    { food_id: "food-soysauce", food_name: "Nước tương", category: "Gia vị", unit: "ml", icon: "🧂" },
  ];

  return {
    users: [
      { user_id, full_name: "Người dùng", email: "user@nateat.vn", password: "User@123", role: "USER" },
      { user_id: "user-2", full_name: "Nam", email: "nam@nateat.vn", password: "User@123", role: "USER" },
      { user_id: "user-3", full_name: "Hùng", email: "hung@nateat.vn", password: "User@123", role: "USER" },
      { user_id: "user-4", full_name: "Thành", email: "thanh@nateat.vn", password: "User@123", role: "USER" },
      { user_id: "admin-1", full_name: "Quản trị viên", email: "admin@nateat.vn", password: "Admin@123", role: "ADMIN" },
    ],
    foods,
    recipes: [
      { recipe_id: "recipe-bo-luc-lac", recipe_name: "Cơm bò lúc lắc", description: "Bò xào nhanh với cà chua, hành tây, tỏi và nước tương.", instructions: ["Ướp bò với tỏi và nước tương.", "Xào bò lửa lớn.", "Thêm cà chua, hành tây, nêm vừa ăn."], time_minutes: 20, calories: 450, difficulty: "Dễ làm", is_favorite: true },
      { recipe_id: "recipe-pho", recipe_name: "Phở bò tái", description: "Phở bò dùng nguyên liệu có trong tủ lạnh.", instructions: ["Nấu nước dùng.", "Trụng phở.", "Cho bò tái và chan nước dùng."], time_minutes: 40, calories: 520, difficulty: "Trung bình" },
      { recipe_id: "recipe-rice", recipe_name: "Cơm rang dưa bò", description: "Cơm rang nhanh cho bữa trưa gia đình.", instructions: ["Rang cơm.", "Xào bò.", "Trộn đều và nêm lại."], time_minutes: 25, calories: 480, difficulty: "Dễ làm" },
      { recipe_id: "recipe-soup", recipe_name: "Canh chua cá lóc", description: "Canh chua miền Nam từ cá lóc và cà chua.", instructions: ["Sơ chế cá.", "Nấu canh chua.", "Nêm vừa ăn."], time_minutes: 30, calories: 320, difficulty: "Dễ làm" },
    ],
    recipe_ingredients: [
      { id: "ri-1", recipe_id: "recipe-bo-luc-lac", food_id: "food-beef", quantity: 300 },
      { id: "ri-2", recipe_id: "recipe-bo-luc-lac", food_id: "food-tomato", quantity: 2 },
      { id: "ri-3", recipe_id: "recipe-bo-luc-lac", food_id: "food-onion", quantity: 1 },
      { id: "ri-4", recipe_id: "recipe-bo-luc-lac", food_id: "food-garlic", quantity: 1 },
      { id: "ri-5", recipe_id: "recipe-bo-luc-lac", food_id: "food-chili", quantity: 1 },
      { id: "ri-6", recipe_id: "recipe-bo-luc-lac", food_id: "food-soysauce", quantity: 50 },
      { id: "ri-7", recipe_id: "recipe-pho", food_id: "food-noodle", quantity: 1 },
      { id: "ri-8", recipe_id: "recipe-pho", food_id: "food-beef", quantity: 200 },
      { id: "ri-9", recipe_id: "recipe-rice", food_id: "food-rice", quantity: 1 },
      { id: "ri-10", recipe_id: "recipe-rice", food_id: "food-beef", quantity: 150 },
      { id: "ri-11", recipe_id: "recipe-soup", food_id: "food-fish", quantity: 1 },
      { id: "ri-12", recipe_id: "recipe-soup", food_id: "food-tomato", quantity: 2 },
    ],
    families: [{ family_id, family_name: "Gia đình NATEAT", created_by: user_id }],
    family_members: [
      { id: "fm-1", family_id, user_id },
      { id: "fm-2", family_id, user_id: "user-2" },
      { id: "fm-3", family_id, user_id: "user-3" },
      { id: "fm-4", family_id, user_id: "user-4" },
    ],
    fridge_items: [
      { fridge_item_id: "fridge-1", family_id, food_id: "food-beef", quantity: 500, expiry_date: addDaysIso(2), location: "Ngăn mát" },
      { fridge_item_id: "fridge-1b", family_id, food_id: "food-beef", quantity: 300, expiry_date: addDaysIso(7), location: "Ngăn đông" },
      { fridge_item_id: "fridge-2", family_id, food_id: "food-tomato", quantity: 6, expiry_date: addDaysIso(5), location: "Ngăn mát" },
      { fridge_item_id: "fridge-3", family_id, food_id: "food-onion", quantity: 2, expiry_date: addDaysIso(10), location: "Kệ thường" },
      { fridge_item_id: "fridge-4", family_id, food_id: "food-garlic", quantity: 1, expiry_date: addDaysIso(30), location: "Kệ thường" },
      { fridge_item_id: "fridge-5", family_id, food_id: "food-milk", quantity: 1, expiry_date: addDaysIso(4), location: "Ngăn mát" },
      { fridge_item_id: "fridge-6", family_id, food_id: "food-fish", quantity: 1, expiry_date: addDaysIso(20), location: "Ngăn đông" },
      { fridge_item_id: "fridge-7", family_id, food_id: "food-tofu", quantity: 4, expiry_date: addDaysIso(3), location: "Ngăn mát" },
    ],
    shopping_lists: [{ shopping_list_id: "shopping-1", family_id, title: "Chợ cuối tuần", plan_date: todayIso(), status: "DRAFT", created_by: user_id, list_type: "weekly" }],
    shopping_list_items: [
      { id: "si-1", shopping_list_id: "shopping-1", food_id: "food-tomato", quantity: 500, bought_status: true },
      { id: "si-2", shopping_list_id: "shopping-1", food_id: "food-onion", quantity: 2, bought_status: true },
      { id: "si-3", shopping_list_id: "shopping-1", food_id: "food-fish", quantity: 1, bought_status: false },
      { id: "si-4", shopping_list_id: "shopping-1", food_id: "food-tofu", quantity: 4, bought_status: false },
      { id: "si-5", shopping_list_id: "shopping-1", food_id: "food-soysauce", quantity: 1, bought_status: false },
    ],
    meal_plans: [
      { meal_plan_id: "meal-1", family_id, meal_date: todayIso(), meal_type: "Sáng", recipe_id: "recipe-pho" },
      { meal_plan_id: "meal-2", family_id, meal_date: todayIso(), meal_type: "Trưa", recipe_id: "recipe-rice" },
      { meal_plan_id: "meal-3", family_id, meal_date: todayIso(), meal_type: "Tối", recipe_id: "recipe-soup" },
    ],
    family_activities: [
      { id: "act-1", family_id, user_id: "user-2", action_type: "shopping", message: 'thêm "Cà chua, Thịt bò" vào danh sách mua sắm', created_at: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: "act-2", family_id, user_id: "user-3", action_type: "fridge", message: 'cập nhật tủ lạnh: "Sữa tươi hết hạn 10/05"', created_at: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: "act-3", family_id, user_id: "user-4", action_type: "meal", message: 'lên thực đơn "Bữa tối thứ 6"', created_at: new Date(Date.now() - 60 * 60000).toISOString() },
    ],
  };
}

function normalizeDb(current: Db): Db {
  return {
    ...current,
    shopping_list_items: current.shopping_list_items.map((item) => {
      const boughtQuantity = item.bought_quantity ?? (item.bought_status ? item.quantity : 0);
      const remaining = Math.max(0, item.quantity - boughtQuantity);
      return {
        ...item,
        bought_quantity: boughtQuantity,
        remaining_quantity: remaining,
        item_status: item.item_status ?? (boughtQuantity >= item.quantity ? "COMPLETED" : boughtQuantity > 0 ? "PARTIAL" : "PENDING"),
        inventory_synced_quantity: item.inventory_synced_quantity ?? 0,
        bought_status: boughtQuantity >= item.quantity,
      };
    }),
    family_activities: current.family_activities.map((activity) => ({
      ...activity,
      target: activity.target ?? activity.message,
      status: activity.status ?? "done",
    })),
  };
}

export async function db() {
  await wait();
  const current = storage.get<Db | null>(DB_KEY, null);
  if (current) {
    const normalized = normalizeDb(current);
    storage.set(DB_KEY, normalized);
    return normalized;
  }
  const seeded = initialDb();
  storage.set(DB_KEY, seeded);
  return seeded;
}

export function saveDb(next: Db) {
  storage.set(DB_KEY, next);
}

export function getSession() {
  return storage.get<{ token: string; user_id: string } | null>(SESSION_KEY, null);
}

export function setSession(session: { token: string; user_id: string } | null) {
  if (!session) {
    storage.remove(SESSION_KEY);
    localStorage.removeItem("nateat.token");
    return;
  }
  storage.set(SESSION_KEY, session);
  localStorage.setItem("nateat.token", session.token);
}

export function addActivity(
  nextDb: Db,
  family_id: string,
  user_id: string,
  action_type: MockFamilyActivity["action_type"],
  message: string,
) {
  nextDb.family_activities = [
    { id: uid("act"), family_id, user_id, action_type, message, created_at: now() },
    ...nextDb.family_activities,
  ];
}

export { uid };
