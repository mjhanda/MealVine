import { MigrationError } from '../persistence';
import { migrateNotes, useRecipeNotesStore } from '../recipeNotesStore';
import { cookStats } from '../../utils/history';

beforeEach(() => useRecipeNotesStore.setState({ notes: {}, ratings: {} }));

describe('recipe notes and ratings', () => {
  it('sets and clears notes (blank removes the entry)', () => {
    useRecipeNotesStore.getState().setNote('r1', 'less honey');
    expect(useRecipeNotesStore.getState().notes).toEqual({ r1: 'less honey' });
    useRecipeNotesStore.getState().setNote('r1', '   ');
    expect(useRecipeNotesStore.getState().notes).toEqual({});
  });

  it('rates, switches, and toggles off', () => {
    const { rate } = useRecipeNotesStore.getState();
    rate('r1', 'up');
    expect(useRecipeNotesStore.getState().ratings.r1).toBe('up');
    rate('r1', 'down');
    expect(useRecipeNotesStore.getState().ratings.r1).toBe('down');
    rate('r1', 'down');
    expect(useRecipeNotesStore.getState().ratings.r1).toBeUndefined();
  });

  it('migrates defensively', () => {
    expect(migrateNotes({}, 0)).toEqual({ notes: {}, ratings: {} });
    expect(migrateNotes({ notes: { r1: 'x' }, ratings: { r1: 'up' } }, 1)).toEqual({ notes: { r1: 'x' }, ratings: { r1: 'up' } });
    expect(() => migrateNotes(null, 1)).toThrow(MigrationError);
  });
});

describe('cookStats', () => {
  it('counts cooks and keeps the latest time per recipe', () => {
    const stats = cookStats([
      { id: 'a', recipeId: 'r1', servings: 2, cookedAt: 300 },
      { id: 'b', recipeId: 'r2', servings: 2, cookedAt: 200 },
      { id: 'c', recipeId: 'r1', servings: 2, cookedAt: 100 },
    ]);
    expect(stats.get('r1')).toEqual({ times: 2, lastCookedAt: 300 });
    expect(stats.get('r2')).toEqual({ times: 1, lastCookedAt: 200 });
    expect(stats.get('r3')).toBeUndefined();
  });
});
