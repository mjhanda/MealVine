import { groceryItemsFromPlan, groceryKey } from '../grocery';
import { recipeById } from '../recipeCatalog';

const allLines = (grouped: ReturnType<typeof groceryItemsFromPlan>) => Object.values(grouped).flat();

describe('groceryItemsFromPlan', () => {
  it('returns empty categories for an empty plan', () => {
    expect(allLines(groceryItemsFromPlan({ items: [] }))).toHaveLength(0);
  });

  it('scales each entry by its own servings', () => {
    const recipe = recipeById('r1')!;
    const yogurt = recipe.ingredients[0];
    const grouped = groceryItemsFromPlan({ items: [{ id: 'a', recipeId: 'r1', servings: recipe.servings * 2 }] });
    const line = allLines(grouped).find((l) => l.name === yogurt.name)!;
    expect(line.amount).toBeCloseTo(yogurt.amount * 2);
  });

  it('sums the same ingredient across entries', () => {
    const recipe = recipeById('r1')!;
    const yogurt = recipe.ingredients[0];
    const grouped = groceryItemsFromPlan({
      items: [
        { id: 'a', recipeId: 'r1', servings: recipe.servings },
        { id: 'b', recipeId: 'r1', servings: recipe.servings },
      ],
    });
    const lines = allLines(grouped).filter((l) => l.name === yogurt.name);
    expect(lines).toHaveLength(1);
    expect(lines[0].amount).toBeCloseTo(yogurt.amount * 2);
  });

  it('skips unknown recipe ids', () => {
    expect(allLines(groceryItemsFromPlan({ items: [{ id: 'a', recipeId: 'gone', servings: 2 }] }))).toHaveLength(0);
  });

  it('sorts lines alphabetically within a category', () => {
    const grouped = groceryItemsFromPlan({ items: [{ id: 'a', recipeId: 'r2', servings: 2 }] });
    Object.values(grouped).forEach((lines) => {
      const names = lines.map((l) => l.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });
  });
});

describe('groceryKey', () => {
  it('distinguishes units', () => expect(groceryKey('Celery', 'cup')).not.toBe(groceryKey('Celery', 'stalk')));
});
