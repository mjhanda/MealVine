import { manualKey, useGroceryStore } from '../groceryStore';
import { startPlanGrocerySync } from '../planGrocerySync';
import { usePlanStore } from '../planStore';

let stop: () => void;

beforeEach(() => {
  usePlanStore.setState({ plan: { items: [] }, hasHydrated: true });
  useGroceryStore.setState({ checked: {}, manualItems: [] });
  stop = startPlanGrocerySync();
});
afterEach(() => stop());

describe('plan ↔ grocery check-off sync', () => {
  it('a checked ingredient comes back unchecked after its recipes leave and return', () => {
    usePlanStore.getState().addItem('r2', 2); // uses eggs
    useGroceryStore.getState().toggleCheck('eggs');
    const [item] = usePlanStore.getState().plan.items;
    usePlanStore.getState().removeItem(item.id);
    usePlanStore.getState().addItem('r2', 2);
    expect(useGroceryStore.getState().checked.eggs).toBeUndefined();
  });

  it('keeps a check while another planned recipe still needs the ingredient', () => {
    usePlanStore.getState().addItem('r2', 2);
    usePlanStore.getState().addItem('r2', 2);
    useGroceryStore.getState().toggleCheck('eggs');
    usePlanStore.getState().removeItem(usePlanStore.getState().plan.items[0].id);
    expect(useGroceryStore.getState().checked.eggs).toBe(true);
  });

  it('manual items survive plan changes, checks included', () => {
    useGroceryStore.getState().addManual('Dish soap');
    const { id } = useGroceryStore.getState().manualItems[0];
    useGroceryStore.getState().toggleCheck(manualKey(id));
    usePlanStore.getState().addItem('r1', 2);
    usePlanStore.getState().clear();
    expect(useGroceryStore.getState().manualItems).toHaveLength(1);
    expect(useGroceryStore.getState().checked[manualKey(id)]).toBe(true);
  });

  it('does not prune during hydration (before the plan has loaded)', () => {
    useGroceryStore.setState({ checked: { eggs: true } });
    usePlanStore.setState({ hasHydrated: false, plan: { items: [] } });
    usePlanStore.setState({ plan: { items: [{ id: 'x', recipeId: 'r2', servings: 2 }] } });
    expect(useGroceryStore.getState().checked.eggs).toBe(true);
  });

  it('removing a manual item drops its check', () => {
    useGroceryStore.getState().addManual('Foil');
    const { id } = useGroceryStore.getState().manualItems[0];
    useGroceryStore.getState().toggleCheck(manualKey(id));
    useGroceryStore.getState().removeManual(id);
    expect(useGroceryStore.getState().checked).toEqual({});
  });
});

describe('grocery store actions', () => {
  it('addManual guesses the aisle; updateManual edits name and aisle', () => {
    useGroceryStore.getState().addManual('Milk');
    const [m] = useGroceryStore.getState().manualItems;
    expect(m.aisle).toBe('Dairy & Eggs');
    useGroceryStore.getState().updateManual(m.id, { name: 'Oat milk', aisle: 'Beverages' });
    expect(useGroceryStore.getState().manualItems[0]).toMatchObject({ name: 'Oat milk', aisle: 'Beverages' });
  });

  it('setPantry sets and clears overrides', () => {
    useGroceryStore.setState({ pantry: {} });
    useGroceryStore.getState().setPantry('carrot', 'have');
    useGroceryStore.getState().setPantry('salt', 'need');
    expect(useGroceryStore.getState().pantry).toEqual({ carrot: 'have', salt: 'need' });
    useGroceryStore.getState().setPantry('carrot', null);
    expect(useGroceryStore.getState().pantry).toEqual({ salt: 'need' });
  });
});
