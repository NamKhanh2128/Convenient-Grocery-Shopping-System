// Single source of truth for the system's standard food units. Must match
// the canonical rows seeded in database/supabase/seed.sql exactly — every
// module (fridge, shopping, recipes/meal plan, stats) resolves units through
// this list so "kg" in the fridge is the same row as "kg" in a recipe.
//
// `symbol` here is what's actually stored in the `units.symbol` column for
// each canonical unit. For everything except weight/volume metrics, the
// symbol is identical to the Vietnamese name (e.g. 'quả' -> 'quả'), NOT an
// English abbreviation — a previous bug (UNIT_SYMBOLS in shoppingBridge.js)
// mapped quả/củ/miếng all to the English 'pcs', which doesn't exist in the
// real table, so every lookup failed and silently created a junk "pcs" unit
// row. Don't reintroduce that.
const CANONICAL_UNITS = [
  { name: 'kg', symbol: 'kg' },
  { name: 'g', symbol: 'g' },
  { name: 'lít', symbol: 'l' },
  { name: 'ml', symbol: 'ml' },
  { name: 'quả', symbol: 'quả' },
  { name: 'củ', symbol: 'củ' },
  { name: 'miếng', symbol: 'miếng' },
  { name: 'gói', symbol: 'gói' },
  { name: 'hộp', symbol: 'hộp' },
  { name: 'bó', symbol: 'bó' },
];

// Fallback unit used when an input string doesn't match anything canonical
// and we can't ask the user — matches the fallback already used elsewhere
// in the frontend (toFridgeRow defaults to "miếng").
const FALLBACK_UNIT_NAME = 'miếng';

// Common synonyms/typos/English fallbacks that should resolve to a canonical
// unit instead of creating a new row. Keys are lowercase, trimmed.
const UNIT_SYNONYMS = {
  kgs: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  gram: 'g',
  grams: 'g',
  gr: 'g',
  lit: 'lít',
  liter: 'lít',
  liters: 'lít',
  litre: 'lít',
  litres: 'lít',
  l: 'lít',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  pcs: 'miếng',
  pc: 'miếng',
  piece: 'miếng',
  pieces: 'miếng',
  cái: 'miếng',
  pack: 'gói',
  packs: 'gói',
  packet: 'gói',
  box: 'hộp',
  boxes: 'hộp',
  bunch: 'bó',
  bunches: 'bó',
};

function normalizeUnitName(rawUnit) {
  const text = String(rawUnit || '').trim().toLowerCase();
  if (!text) return FALLBACK_UNIT_NAME;

  const exact = CANONICAL_UNITS.find(
    (u) => u.name.toLowerCase() === text || u.symbol.toLowerCase() === text
  );
  if (exact) return exact.name;

  const synonym = UNIT_SYNONYMS[text];
  if (synonym) return synonym;

  return FALLBACK_UNIT_NAME;
}

module.exports = { CANONICAL_UNITS, FALLBACK_UNIT_NAME, normalizeUnitName };
