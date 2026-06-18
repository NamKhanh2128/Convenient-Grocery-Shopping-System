import type { FoodUnit } from "@/types";
import { foodUnits } from "@/shared/constants/options";

// Mirrors backend/src/config/unitsConfig.js — keep both in sync. Maps common
// synonyms/typos/English fallbacks to one of the system's canonical units
// instead of letting mismatched strings slip through as-is.
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

/** Resolves any raw unit string to one of the system's canonical FoodUnit values. */
export function normalizeFoodUnit(value?: string | null): FoodUnit {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return FALLBACK_UNIT;
  if (foodUnits.includes(text as FoodUnit)) return text as FoodUnit;
  return UNIT_SYNONYMS[text] ?? FALLBACK_UNIT;
}
