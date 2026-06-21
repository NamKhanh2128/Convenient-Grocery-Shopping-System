// Must match the canonical rows seeded in database/supabase/seed.sql exactly.
// `symbol` must equal the Vietnamese name, not an English abbreviation —
// mapping quả/củ/miếng to 'pcs' previously broke every unit lookup (see shoppingBridge.js history).
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
