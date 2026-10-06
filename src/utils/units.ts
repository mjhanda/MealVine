import { Unit } from '../types';

export const scaleAmount = (amount: number, baseServings: number, targetServings: number): number =>
  (amount / baseServings) * targetServings;

// --- Display -----------------------------------------------------------------
// Kitchen amounts are shown as whole numbers plus a common fraction, never decimals.

const FRACTIONS: [number, string][] = [
  [0, ''],
  [1 / 8, '⅛'],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [1, ''],
];

// 1.125 → "1⅛", 0.33 → "⅓", 2.98 → "3". Any positive amount shows at least "⅛".
export function formatAmount(n: number): string {
  if (n <= 0) return '0';
  let whole = Math.floor(n);
  const rest = n - whole;
  let [value, glyph] = FRACTIONS.reduce((best, f) => (Math.abs(f[0] - rest) < Math.abs(best[0] - rest) ? f : best));
  if (value === 1) {
    whole += 1;
    glyph = '';
  }
  if (whole === 0 && glyph === '') return '⅛';
  return whole === 0 ? glyph : `${whole}${glyph}`;
}

const PLURAL_UNITS: Partial<Record<Unit, string>> = {
  cup: 'cups',
  can: 'cans',
  clove: 'cloves',
  stalk: 'stalks',
  head: 'heads',
  bunch: 'bunches',
  slice: 'slices',
  pinch: 'pinches',
};

// "1⅛ cups", "1 cup", "2 tbsp", "3" (a count has no unit).
export function formatQuantity(amount: number, unit: Unit | null): string {
  const text = formatAmount(amount);
  if (!unit) return text;
  const plural = PLURAL_UNITS[unit];
  const singular = text === '1' || (!/^\d/.test(text) && text !== '0'); // "1" or a pure fraction like "½"
  return `${text} ${plural && !singular ? plural : unit}`;
}

// --- Unit families -----------------------------------------------------------
// Volume and weight units convert within their family; every other unit
// (can, clove, stalk, …) and null (a plain count) is its own family.

const TSP_PER: Record<string, number> = { tsp: 1, tbsp: 3, cup: 48 };
const OZ_PER: Record<string, number> = { oz: 1, lb: 16 };

export type UnitFamily = 'volume' | 'weight' | 'count' | Exclude<Unit, 'tsp' | 'tbsp' | 'cup' | 'oz' | 'lb'>;

export function unitFamily(unit: Unit | null): UnitFamily {
  if (unit === null) return 'count';
  if (unit in TSP_PER) return 'volume';
  if (unit in OZ_PER) return 'weight';
  return unit as UnitFamily;
}

// Converts to the family's base unit (tsp for volume, oz for weight); other families pass through.
export function toBase(amount: number, unit: Unit | null): number {
  if (unit !== null && unit in TSP_PER) return amount * TSP_PER[unit];
  if (unit !== null && unit in OZ_PER) return amount * OZ_PER[unit];
  return amount;
}

// Picks the most readable unit for a base amount: ≥ ¼ cup → cups, ≥ 1 tbsp → tbsp, else tsp;
// ≥ 1 lb → lb, else oz.
export function fromBase(baseAmount: number, family: UnitFamily, fallbackUnit: Unit | null): { amount: number; unit: Unit | null } {
  if (family === 'volume') {
    if (baseAmount >= TSP_PER.cup / 4) return { amount: baseAmount / TSP_PER.cup, unit: 'cup' };
    if (baseAmount >= TSP_PER.tbsp) return { amount: baseAmount / TSP_PER.tbsp, unit: 'tbsp' };
    return { amount: baseAmount, unit: 'tsp' };
  }
  if (family === 'weight') {
    if (baseAmount >= OZ_PER.lb) return { amount: baseAmount / OZ_PER.lb, unit: 'lb' };
    return { amount: baseAmount, unit: 'oz' };
  }
  return { amount: baseAmount, unit: fallbackUnit };
}

// What you'd actually buy: whole items for counts and discrete units (½ cucumber → 1, ⅓ can → 1);
// volume and weight stay as measured. The epsilon stops 2.0000001 from becoming 3.
export function roundForPurchase(amount: number, family: UnitFamily): number {
  if (family === 'volume' || family === 'weight') return amount;
  return Math.max(1, Math.ceil(amount - 1e-6));
}
