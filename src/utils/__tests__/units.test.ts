import { fromBase, scaleAmount, toBase, trimNum, unitFamily, unitLabel } from '../units';

describe('trimNum', () => {
  it('keeps integers', () => expect(trimNum(3)).toBe(3));
  it('rounds to two decimals', () => expect(trimNum(1 / 3)).toBe(0.33));
});

describe('scaleAmount', () => {
  it('scales linearly by servings', () => expect(scaleAmount(2, 2, 6)).toBe(6));
  it('scales down', () => expect(scaleAmount(1, 4, 2)).toBe(0.5));
});

describe('unitLabel', () => {
  it('omits unit when null', () => expect(unitLabel(2, null)).toBe('2'));
  it('pluralizes regular units', () => expect(unitLabel(2, 'cup')).toBe('2 cups'));
  it('keeps singular for 1', () => expect(unitLabel(1, 'cup')).toBe('1 cup'));
  it('adds -es after h', () => expect(unitLabel(2, 'pinch')).toBe('2 pinches'));
  it('never pluralizes abbreviations', () => expect(unitLabel(3, 'tbsp')).toBe('3 tbsp'));
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
