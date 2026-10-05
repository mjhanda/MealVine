import { migrateLegacyPlan } from '../planStore';

describe('migrateLegacyPlan', () => {
  it('returns [] for null or missing entries', () => {
    expect(migrateLegacyPlan(null)).toEqual([]);
    expect(migrateLegacyPlan({})).toEqual([]);
  });

  it('flattens a weekly grid into plan items with recipe default servings', () => {
    const items = migrateLegacyPlan({
      entries: { mon: { breakfast: 'r1', dinner: undefined }, tue: undefined, wed: { lunch: 'r2' } },
    });
    expect(items.map((i) => i.recipeId)).toEqual(['r1', 'r2']);
    expect(new Set(items.map((i) => i.id)).size).toBe(2);
    items.forEach((i) => expect(i.servings).toBeGreaterThan(0));
  });
});
