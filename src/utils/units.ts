const NO_PLURAL_UNITS = ['oz', 'lb', 'tbsp', 'tsp', 'large'];

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
