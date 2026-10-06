import { RECIPES } from '../../data/recipes';
import { formatCountdown, stepIngredients, stepMinutes } from '../cooking';

describe('stepMinutes', () => {
  it.each([
    ['Simmer 15 minutes.', 15],
    ['Bake 20–25 min until golden.', 25],
    ['Cook 3-4 minutes per side.', 4],
    ['Cook 2 to 3 minutes', 3],
    ['Roast for 1 hour', 60],
    ['Slow cook 1.5 hours', 90],
    ['Stir in the rice.', null],
    ['Serve with 2 lemons', null],
  ])('%p → %p', (step, minutes) => expect(stepMinutes(step)).toBe(minutes));

  it('finds a timer in at least a fifth of all catalog steps', () => {
    const steps = RECIPES.flatMap((r) => r.steps);
    expect(steps.filter((s) => stepMinutes(s) !== null).length).toBeGreaterThan(steps.length / 5);
  });
});

describe('stepIngredients', () => {
  const r95 = RECIPES.find((r) => r.id === 'r95')!; // One-Pot Chicken & Rice
  it('matches names and plurals in step text', () => {
    expect(stepIngredients(r95, r95.steps[1]).map((i) => i.id)).toEqual(['carrot', 'yellow-onion', 'chicken-broth', 'dried-thyme']);
  });
  it('matches a distinctive head word ("rice")', () => {
    expect(stepIngredients(r95, r95.steps[2]).map((i) => i.id)).toEqual(['white-rice']);
  });
  it('does not match a word shared by two ingredients ("chicken" with chicken broth present)', () => {
    expect(stepIngredients(r95, 'Brown diced chicken.').map((i) => i.id)).toEqual([]);
  });
  it('finds ingredients for most steps across the catalog', () => {
    const pairs = RECIPES.flatMap((r) => r.steps.map((s) => stepIngredients(r, s).length > 0));
    expect(pairs.filter(Boolean).length / pairs.length).toBeGreaterThan(0.8);
  });
});

describe('formatCountdown', () => {
  it.each([
    [0, '0:00'],
    [500, '0:01'],
    [65_000, '1:05'],
    [15 * 60_000, '15:00'],
    [-3000, '0:00'],
  ])('%p ms → %p', (ms, out) => expect(formatCountdown(ms)).toBe(out));
});
