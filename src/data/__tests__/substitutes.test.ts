import { HOMEMADE } from '../homemade';
import { INGREDIENTS } from '../ingredients';
import { RECIPES } from '../recipes';
import { NO_SUBSTITUTE, SUBSTITUTES } from '../substitutes';
import { substituteParts } from '../../utils/substitutes';
import { unitFamily, UnitFamily } from '../../utils/units';

// The one unit family each ingredient uses across the catalog (the recipes test enforces "one").
const FAMILY = new Map<string, UnitFamily>();
const USES = new Map<string, number>();
RECIPES.forEach((r) => {
  r.ingredients.forEach((i) => FAMILY.set(i.id, unitFamily(i.unit)));
  new Set(r.ingredients.map((i) => i.id)).forEach((id) => USES.set(id, (USES.get(id) ?? 0) + 1));
});

const entries = Object.entries(SUBSTITUTES);

describe('substitution catalog', () => {
  it('only lists catalog ingredients, never the ingredient itself, and no duplicates', () => {
    entries.forEach(([original, subs]) => {
      expect([original, Boolean(INGREDIENTS[original])]).toEqual([original, true]);
      expect([original, subs.length > 0]).toEqual([original, true]);
      const mains = subs.map((s) => `${s.id}|${(s.with ?? []).map((w) => w.id).join(',')}`);
      expect([original, new Set(mains).size]).toEqual([original, mains.length]);
      subs.forEach((s) => {
        expect([original, s.id === original]).toEqual([original, false]);
        substituteParts(s).forEach((p) => {
          expect([original, p.id, Boolean(INGREDIENTS[p.id])]).toEqual([original, p.id, true]);
          expect([original, p.id, Number.isFinite(p.ratio) && p.ratio > 0]).toEqual([original, p.id, true]);
        });
      });
    });
  });

  it("every part converts into the unit family that ingredient uses across the catalog", () => {
    entries.forEach(([original, subs]) => {
      const from = FAMILY.get(original);
      subs.forEach((s) =>
        substituteParts(s).forEach((p) => {
          const to = p.unit === undefined ? from : unitFamily(p.unit);
          expect([original, p.id, to]).toEqual([original, p.id, FAMILY.get(p.id)]);
        })
      );
    });
  });

  it('covers every non-staple ingredient used in 3 or more recipes', () => {
    const missing = Object.values(INGREDIENTS)
      .filter((d) => !d.staple && (USES.get(d.id) ?? 0) >= 3)
      .filter((d) => !SUBSTITUTES[d.id]?.length && !NO_SUBSTITUTE[d.id] && !HOMEMADE[d.id])
      .map((d) => d.id);
    expect(missing).toEqual([]);
  });

  it('lists a reason for every ingredient without a substitute, and those really have none', () => {
    Object.entries(NO_SUBSTITUTE).forEach(([id, reason]) => {
      expect(INGREDIENTS[id]).toBeDefined();
      expect(reason.length).toBeGreaterThan(10);
      expect(SUBSTITUTES[id]).toBeUndefined();
    });
  });

  it('keeps notes and contexts short and free of exclamation marks', () => {
    entries.forEach(([original, subs]) =>
      subs.forEach((s) =>
        [s.note, s.context].filter((t): t is string => t !== undefined).forEach((t) => {
          expect([original, t.length <= 90, t.includes('!')]).toEqual([original, true, false]);
        })
      )
    );
  });
});
