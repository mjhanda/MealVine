const PLURAL_OVERRIDES: Record<string, string> = {
  oz: 'oz',
  lb: 'lb',
};

export const trimNum = (n: number): number => (Number.isInteger(n) ? n : Math.round(n * 100) / 100);

export const scaleAmount = (amount: number, baseServings: number, targetServings: number): number =>
  (amount / baseServings) * targetServings;

export const unitLabel = (amount: number, unit: string | null): string => {
  const displayAmount = trimNum(amount);
  if (!unit) return `${displayAmount}`;
  const isPlural = amount !== 1 && !Object.keys(PLURAL_OVERRIDES).includes(unit);
  const base = PLURAL_OVERRIDES[unit] || unit;
  const pluralized = base.endsWith('h') ? `${base}es` : `${base}s`;
  return `${displayAmount} ${isPlural ? pluralized : base}`;
};
