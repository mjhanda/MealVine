import { scaleAmount, trimNum, unitLabel } from '../units';

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
