import heroDish from "@/assets/hero-dish.jpg";
import phoImg from "@/assets/meal-pho.jpg";
import riceImg from "@/assets/meal-rice.jpg";
import soupImg from "@/assets/meal-soup.jpg";
import type {
  Family,
  FamilyActivity,
  FamilyMember,
  Food,
  FridgeItem,
  MealPlan,
  Recipe,
  RecipeIngredient,
  ShoppingList,
  ShoppingListItem,
  User,
} from "@/types";
import { addDaysIso, todayIso } from "@/shared/utils/date";
import { storage, uid, wait } from "@/shared/utils/storage";

type Db = {
  users: User[];
  foods: Food[];
  recipes: Recipe[];
  recipe_ingredients: RecipeIngredient[];
  families: Family[];
  family_members: FamilyMember[];
  shopping_lists: ShoppingList[];
  shopping_list_items: ShoppingListItem[];
  fridge_items: FridgeItem[];
  meal_plans: MealPlan[];
  family_activities: FamilyActivity[];
};

const DB_KEY = "nateat.db.v3";
const SESSION_KEY = "nateat.session";

const now = () => new Date().toISOString();

function initialDb(): Db {
  const family_id = "family-1";
  const user_id = "user-1";
  const foods: Food[] = [
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
      { recipe_id: "1", recipe_name: "Cơm bò lúc lắc", description: "Bò xào nhanh với cà chua, hành tây, tỏi và nước tương.", instructions: ["Ướp bò với tỏi và nước tương.", "Xào bò lửa lớn.", "Thêm cà chua, hành tây, nêm vừa ăn."], image_url: heroDish, time_minutes: 20, calories: 450, difficulty: "Dễ làm", is_favorite: true },
      { recipe_id: "2", recipe_name: "Phở bò tái", description: "Phở bò dùng nguyên liệu có trong tủ lạnh.", instructions: ["Nấu nước dùng.", "Trụng phở.", "Cho bò tái và chan nước dùng."], image_url: phoImg, time_minutes: 40, calories: 520, difficulty: "Trung bình" },
      { recipe_id: "3", recipe_name: "Cơm rang dưa bò", description: "Cơm rang nhanh cho bữa trưa gia đình.", instructions: ["Rang cơm.", "Xào bò.", "Trộn đều và nêm lại."], image_url: riceImg, time_minutes: 25, calories: 480, difficulty: "Dễ làm" },
      { recipe_id: "4", recipe_name: "Canh chua cá lóc", description: "Canh chua miền Nam từ cá lóc và cà chua.", instructions: ["Sơ chế cá.", "Nấu canh chua.", "Nêm vừa ăn."], image_url: soupImg, time_minutes: 30, calories: 320, difficulty: "Dễ làm" },
    ],
    recipe_ingredients: [
      { id: "ri-1", recipe_id: "1", food_id: "food-beef", quantity: 300 },
      { id: "ri-2", recipe_id: "1", food_id: "food-tomato", quantity: 2 },
      { id: "ri-3", recipe_id: "1", food_id: "food-onion", quantity: 1 },
      { id: "ri-4", recipe_id: "1", food_id: "food-garlic", quantity: 1 },
      { id: "ri-5", recipe_id: "1", food_id: "food-chili", quantity: 1 },
      { id: "ri-6", recipe_id: "1", food_id: "food-soysauce", quantity: 50 },
      { id: "ri-7", recipe_id: "2", food_id: "food-noodle", quantity: 1 },
      { id: "ri-8", recipe_id: "2", food_id: "food-beef", quantity: 200 },
      { id: "ri-9", recipe_id: "3", food_id: "food-rice", quantity: 1 },
      { id: "ri-10", recipe_id: "3", food_id: "food-beef", quantity: 150 },
      { id: "ri-11", recipe_id: "4", food_id: "food-fish", quantity: 1 },
      { id: "ri-12", recipe_id: "4", food_id: "food-tomato", quantity: 2 },
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
      { meal_plan_id: "meal-1", family_id, meal_date: todayIso(), meal_type: "Sáng", recipe_id: "2" },
      { meal_plan_id: "meal-2", family_id, meal_date: todayIso(), meal_type: "Trưa", recipe_id: "3" },
      { meal_plan_id: "meal-3", family_id, meal_date: todayIso(), meal_type: "Tối", recipe_id: "4" },
    ],
    family_activities: [
      { id: "act-1", family_id, user_id: "user-2", action_type: "shopping", message: 'thêm "Cà chua, Thịt bò" vào danh sách mua sắm', created_at: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: "act-2", family_id, user_id: "user-3", action_type: "fridge", message: 'cập nhật tủ lạnh: "Sữa tươi hết hạn 10/05"', created_at: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: "act-3", family_id, user_id: "user-4", action_type: "meal", message: 'lên thực đơn "Bữa tối thứ 6"', created_at: new Date(Date.now() - 60 * 60000).toISOString() },
    ],
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

export function addActivity(nextDb: Db, family_id: string, user_id: string, action_type: FamilyActivity["action_type"], message: string) {
  nextDb.family_activities = [
    { id: uid("act"), family_id, user_id, action_type, message, created_at: now() },
    ...nextDb.family_activities,
  ];
}

function assertValidQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Số lượng phải lớn hơn 0.");
  }
}

export function addInventory(nextDb: Db, payload: { family_id: string; food_id: string; quantity: number; expiry_date?: string; location?: FridgeItem["location"] }) {
  assertValidQuantity(payload.quantity);
  const location = payload.location ?? "Ngăn mát";
  const expiryDate = payload.expiry_date ?? addDaysIso(7);
  const existing = nextDb.fridge_items.find((item) => item.family_id === payload.family_id && item.food_id === payload.food_id && item.location === location);
  if (existing) {
    existing.quantity += payload.quantity;
    if (expiryDate > existing.expiry_date) existing.expiry_date = expiryDate;
    return existing;
  }
  const created: FridgeItem = {
    fridge_item_id: uid("fridge"),
    family_id: payload.family_id,
    food_id: payload.food_id,
    quantity: payload.quantity,
    expiry_date: expiryDate,
    location,
  };
  nextDb.fridge_items.push(created);
  return created;
}

export function consumeInventory(nextDb: Db, payload: { family_id: string; food_id: string; quantity: number }) {
  assertValidQuantity(payload.quantity);
  let remaining = payload.quantity;
  const rows = nextDb.fridge_items
    .filter((item) => item.family_id === payload.family_id && item.food_id === payload.food_id && item.quantity > 0)
    .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));

  for (const row of rows) {
    if (remaining <= 0) break;
    const used = Math.min(row.quantity, remaining);
    row.quantity -= used;
    remaining -= used;
  }

  nextDb.fridge_items = nextDb.fridge_items.filter((item) => item.quantity > 0);
  return { consumed: payload.quantity - remaining, shortage: remaining };
}

export function updateInventory(nextDb: Db, fridge_item_id: string, patch: Partial<FridgeItem>) {
  const item = nextDb.fridge_items.find((row) => row.fridge_item_id === fridge_item_id);
  if (!item) throw new Error("Không tìm thấy thực phẩm.");
  if (patch.quantity !== undefined && (!Number.isFinite(patch.quantity) || patch.quantity < 0)) {
    throw new Error("Số lượng không hợp lệ.");
  }
  Object.assign(item, patch);
  if (item.quantity === 0) nextDb.fridge_items = nextDb.fridge_items.filter((row) => row.fridge_item_id !== fridge_item_id);
  return item;
}
