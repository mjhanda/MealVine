import { Unit } from '../types';

const NO_PLURAL_UNITS: (Unit | string)[] = ['oz', 'lb', 'tbsp', 'tsp'];

export const trimNum = (n: number): number => (Number.isInteger(n) ? n : Math.round(n * 100) / 100);

export const scaleAmount = (amount: number, baseServings: number, targetServings: number): number =>
  (amount / baseServings) * targetServings;

export const unitLabel = (amount: number, unit: string | null): string => {
  const displayAmount = trimNum(amount);
  if (!unit) return `${displayAmount}`;
  const isPlural = amount !== 1 && !NO_PLURAL_UNITS.includes(unit);
  const pluralized = unit.endsWith('h') ? `${unit}es` : `${unit}s`;
  return `${displayAmount} ${isPlural ? pluralized : unit}`;
};

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
