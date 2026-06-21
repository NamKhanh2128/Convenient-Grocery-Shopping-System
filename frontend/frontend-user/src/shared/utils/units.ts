import type { FoodUnit } from "@/types";
import { foodUnits } from "@/shared/constants/options";

// Mirrors backend/src/config/unitsConfig.js — keep both in sync.
const UNIT_SYNONYMS: Record<string, FoodUnit> = {
  kgs: "kg",
  kilogram: "kg",
  kilograms: "kg",
  gram: "g",
  grams: "g",
  gr: "g",
  lit: "lít",
  liter: "lít",
  liters: "lít",
  litre: "lít",
  litres: "lít",
  l: "lít",
  milliliter: "ml",
  milliliters: "ml",
  millilitre: "ml",
  pcs: "miếng",
  pc: "miếng",
  piece: "miếng",
  pieces: "miếng",
  cái: "miếng",
  pack: "gói",
  packs: "gói",
  packet: "gói",
  box: "hộp",
  boxes: "hộp",
  bunch: "bó",
  bunches: "bó",
};

export const FALLBACK_UNIT: FoodUnit = "miếng";

// Units are admin-extensible, so unrecognized values pass through as-is instead
// of being coerced to the fallback; only an empty value falls back.
export function normalizeFoodUnit(value?: string | null): FoodUnit {
  const text = String(value ?? "").trim();
  if (!text) return FALLBACK_UNIT;
  const lower = text.toLowerCase();
  if (foodUnits.includes(lower as FoodUnit)) return lower as FoodUnit;
  if (UNIT_SYNONYMS[lower]) return UNIT_SYNONYMS[lower];
  return text as FoodUnit;
}
