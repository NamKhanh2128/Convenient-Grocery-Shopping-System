import type { FoodCategory, FoodLocation, FoodUnit, MealType } from "@/types";

export const foodCategories: FoodCategory[] = ["Rau củ", "Thịt cá", "Đồ khô", "Sữa & Trứng", "Gia vị", "Khác"];
// Single source of truth for the system's standard food units — must match
// the canonical rows seeded in database/supabase/seed.sql (backend's
// config/unitsConfig.js mirrors this same list server-side).
export const foodUnits: FoodUnit[] = ["kg", "g", "lít", "ml", "quả", "củ", "miếng", "gói", "hộp", "bó"];
export const foodLocations: FoodLocation[] = ["Ngăn mát", "Ngăn đông", "Kệ thường"];
export const mealTypes: MealType[] = ["Sáng", "Trưa", "Tối", "Bữa phụ"];
