export type UserRole = "ADMIN" | "USER" | "admin" | "member";
export type ShoppingStatus = "DRAFT" | "DONE";
export type ShoppingItemStatus = "PENDING" | "PARTIAL" | "COMPLETED";
export type MealType = "Sáng" | "Trưa" | "Tối" | "Bữa phụ";
export type ShoppingType = "daily" | "weekly";
export type FoodCategory = "Rau củ" | "Thịt cá" | "Đồ khô" | "Sữa & Trứng" | "Gia vị" | "Khác";
export type FoodUnit = "kg" | "g" | "lít" | "ml" | "quả" | "củ" | "miếng" | "gói";
export type FoodLocation = "Ngăn mát" | "Ngăn đông" | "Kệ thường";

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

export interface Food {
  food_id: string;
  food_name: string;
  category: FoodCategory;
  unit: FoodUnit;
  icon?: string;
}

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

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  food_id: string;
  quantity: number;
}

export interface Family {
  family_id: string;
  family_name: string;
  family_code?: string;
  created_at?: string;
  created_by?: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
}

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

export interface FridgeItem {
  fridge_item_id: string;
  family_id: string;
  food_id: string;
  quantity: number;
  expiry_date: string;
  location: FoodLocation;
}

export interface MealPlan {
  meal_plan_id: string;
  family_id: string;
  meal_date: string;
  meal_type: MealType;
  recipe_id: string;
}

export interface MealPlanGroup {
  family_id: string;
  meal_date: string;
  meal_type: MealType;
  recipe_ids: string[];
}

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

export interface AuthSession {
  token: string;
  refreshToken?: string;
  user: User;
  family: Family | null;
}

export interface RecipeSuggestion {
  recipe: Recipe;
  available_food_ids: string[];
  missing: Array<{ food: Food; quantity: number }>;
}
