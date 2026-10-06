import { formatAmount, formatQuantity, fromBase, roundForPurchase, scaleAmount, toBase, unitFamily } from '../units';

describe('scaleAmount', () => {
  it('scales linearly by servings', () => expect(scaleAmount(2, 2, 6)).toBe(6));
  it('scales down', () => expect(scaleAmount(1, 4, 2)).toBe(0.5));
});

describe('formatAmount', () => {
  it.each([
    [1, '1'],
    [2, '2'],
    [0.5, '½'],
    [0.33, '⅓'],
    [0.333333, '⅓'],
    [0.67, '⅔'],
    [1.125, '1⅛'],
    [1.5, '1½'],
    [2.75, '2¾'],
    [2.98, '3'],
    [0.95, '1'],
    [0.01, '⅛'],
    [0, '0'],
  ])('%p → %p', (n, out) => expect(formatAmount(n)).toBe(out));

  it('never shows a decimal point for any amount in a fine sweep', () => {
    for (let n = 0.01; n < 20; n += 0.013) expect(formatAmount(n)).not.toMatch(/[.,]/);
  });
});

describe('formatQuantity', () => {
  it.each([
    [2, null, '2'],
    [1, 'cup', '1 cup'],
    [0.5, 'cup', '½ cup'],
    [1.125, 'cup', '1⅛ cups'],
    [3, 'tbsp', '3 tbsp'],
    [2, 'pinch', '2 pinches'],
    [2, 'bunch', '2 bunches'],
    [1, 'clove', '1 clove'],
    [3, 'clove', '3 cloves'],
    [1.5, 'lb', '1½ lb'],
    [0.33, 'can', '⅓ can'],
    [2, 'can', '2 cans'],
  ] as const)('%p %p → %p', (amount, unit, out) => expect(formatQuantity(amount, unit)).toBe(out));
});

describe('roundForPurchase', () => {
  it('rounds counts and discrete units up to whole items', () => {
    expect(roundForPurchase(0.5, 'count')).toBe(1);
    expect(roundForPurchase(1.2, 'count')).toBe(2);
    expect(roundForPurchase(0.333, 'can')).toBe(1);
    expect(roundForPurchase(2.0000001, 'clove')).toBe(2);
  });
  it('leaves measured amounts alone', () => {
    expect(roundForPurchase(1.125, 'volume')).toBe(1.125);
    expect(roundForPurchase(10, 'weight')).toBe(10);
  });
});

describe('unit families', () => {
  it('classifies units', () => {
    expect(unitFamily('tbsp')).toBe('volume');
    expect(unitFamily('lb')).toBe('weight');
    expect(unitFamily('can')).toBe('can');
    expect(unitFamily(null)).toBe('count');
  });
  it('round-trips volume via tsp', () => {
    expect(toBase(1, 'cup')).toBe(48);
    expect(fromBase(toBase(1, 'cup') + toBase(2, 'tbsp'), 'volume', 'cup')).toEqual({ amount: 1.125, unit: 'cup' });
  });
  it('picks tbsp/tsp for small volumes', () => {
    expect(fromBase(6, 'volume', 'cup')).toEqual({ amount: 2, unit: 'tbsp' });
    expect(fromBase(2, 'volume', 'tbsp')).toEqual({ amount: 2, unit: 'tsp' });
  });
  it('picks lb at 16 oz and above', () => {
    expect(fromBase(24, 'weight', 'oz')).toEqual({ amount: 1.5, unit: 'lb' });
    expect(fromBase(10, 'weight', 'lb')).toEqual({ amount: 10, unit: 'oz' });
  });
  it('passes other families through', () => {
    expect(fromBase(3, 'clove', 'clove')).toEqual({ amount: 3, unit: 'clove' });
  });
});
