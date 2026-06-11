// Admin constants/options.ts
// UI helper value lists — correspond to values stored in schema string columns.
// These are NOT database column names; they are valid *values* for those columns.
import type { FoodCategoryLabel, UnitSymbol, StorageLocation } from "@/types";

/** Valid values for food_categories.name_vi (display labels used in filter/form UI) */
export const foodCategories: FoodCategoryLabel[] = [
  "Rau củ",
  "Thịt cá",
  "Đồ khô",
  "Sữa & Trứng",
  "Gia vị",
  "Khác",
];

/** Valid unit symbols for units.symbol */
export const foodUnits: UnitSymbol[] = ["kg", "g", "lít", "ml", "quả", "củ", "miếng", "gói"];

/** Valid values for fridge_items.storage_location */
export const foodLocations: StorageLocation[] = ["Ngăn mát", "Ngăn đông", "Kệ thường"];

/** Valid values for meal_plan_items.meal_type (English, as stored in schema) */
export const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;

/** Display labels for meal_type values */
export const mealTypeLabels: Record<string, string> = {
  breakfast: "Sáng",
  lunch: "Trưa",
  dinner: "Tối",
  snack: "Bữa phụ",
};
