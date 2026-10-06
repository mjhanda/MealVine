import { applyBackup, currentVersions, exportBackupJson, readBackup } from '../backupActions';
import { useFavoritesStore } from '../favoritesStore';
import { useGroceryStore } from '../groceryStore';
import { useHistoryStore } from '../historyStore';
import { markCooked, resetAllData } from '../mealActions';
import { usePlanStore } from '../planStore';
import { usePreferencesStore } from '../preferencesStore';
import { useRecipeNotesStore } from '../recipeNotesStore';
import { BACKUP_FORMAT } from '../../utils/backup';
import { groceryV1, weeklyPlanV0 } from './fixtures';

function seedEverything() {
  useHistoryStore.setState({ cooked: [] });
  usePreferencesStore.setState({ householdSize: 3, diet: 'pescetarian', allergies: ['peanut'], dislikes: ['firm-tofu'], mealTypes: ['dinner'], onboardingComplete: true });
  usePlanStore.setState({ plan: { items: [] }, hasHydrated: true });
  usePlanStore.getState().addItem('r1', 2);
  markCooked(usePlanStore.getState().addItem('r2', 4), 1_000);
  useFavoritesStore.setState({ favorites: ['r1', 'r83'] });
  useGroceryStore.setState({ checked: { eggs: true }, manualItems: [{ id: 'm1', name: 'Foil', aisle: 'Household' }], pantry: { salt: 'need' } });
  useRecipeNotesStore.setState({ notes: { r1: 'less honey' }, ratings: { r1: 'up' } });
}

const pick = () => ({
  prefs: (({ householdSize, diet, allergies, dislikes, mealTypes, onboardingComplete }) => ({ householdSize, diet, allergies, dislikes, mealTypes, onboardingComplete }))(usePreferencesStore.getState()),
  plan: usePlanStore.getState().plan,
  history: useHistoryStore.getState().cooked,
  favorites: useFavoritesStore.getState().favorites,
  grocery: (({ checked, manualItems, pantry }) => ({ checked, manualItems, pantry }))(useGroceryStore.getState()),
  notes: (({ notes, ratings }) => ({ notes, ratings }))(useRecipeNotesStore.getState()),
});

describe('backup export / import', () => {
  it('export → reset all data → import (replace) restores everything', () => {
    seedEverything();
    const before = pick();
    const json = exportBackupJson(new Date('2026-10-05T12:00:00Z'));
    expect(json).not.toContain('hasHydrated');
    resetAllData();
    expect(pick().favorites).toEqual([]);
    const result = readBackup(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.exportedAt).toBe('2026-10-05T12:00:00.000Z');
    applyBackup(result.data, 'replace');
    expect(pick()).toEqual(before);
  });

  it('merge keeps current data and adds the backup on top', () => {
    seedEverything();
    const json = exportBackupJson();
    resetAllData();
    usePreferencesStore.setState({ diet: 'vegan', onboardingComplete: true });
    useFavoritesStore.setState({ favorites: ['r5'] });
    useRecipeNotesStore.setState({ notes: { r1: 'mine wins' }, ratings: {} });
    const result = readBackup(json);
    if (!result.ok) throw new Error(result.error);
    applyBackup(result.data, 'merge');
    expect(usePreferencesStore.getState().diet).toBe('vegan');
    expect(useFavoritesStore.getState().favorites).toEqual(['r5', 'r1', 'r83']);
    expect(useRecipeNotesStore.getState().notes.r1).toBe('mine wins');
    expect(useRecipeNotesStore.getState().ratings.r1).toBe('up');
    expect(useHistoryStore.getState().cooked).toHaveLength(1);
  });

  it('merging the same backup twice does not duplicate anything', () => {
    seedEverything();
    const json = exportBackupJson();
    const result = readBackup(json);
    if (!result.ok) throw new Error(result.error);
    applyBackup(result.data, 'merge');
    applyBackup(result.data, 'merge');
    expect(usePlanStore.getState().plan.items).toHaveLength(1);
    expect(useHistoryStore.getState().cooked).toHaveLength(1);
    expect(useGroceryStore.getState().manualItems).toHaveLength(1);
  });

  it('runs store migrations on old snapshots (weekly plan, v1 grocery)', () => {
    const json = JSON.stringify({
      format: BACKUP_FORMAT,
      backupVersion: 1,
      exportedAt: '2026-01-01T00:00:00Z',
      stores: { plan: { version: 0, state: weeklyPlanV0.state }, grocery: { version: 1, state: groceryV1.state } },
    });
    const result = readBackup(json);
    if (!result.ok) throw new Error(result.error);
    expect(result.data.plan?.plan.items).toHaveLength(3);
    expect(result.data.grocery?.checked).toMatchObject({ 'greek-yogurt': true });
    expect(result.data.preferences).toBeUndefined();
  });

  it.each([
    ['not json', '{oops', 'not valid JSON'],
    ['wrong format', JSON.stringify({ hello: 1 }), "isn't a MealApp backup"],
    ['newer backup format', JSON.stringify({ format: BACKUP_FORMAT, backupVersion: 99, stores: {} }), 'newer version'],
    ['newer store version', JSON.stringify({ format: BACKUP_FORMAT, backupVersion: 1, stores: { plan: { version: 99, state: {} } } }), 'newer version'],
    ['damaged store', JSON.stringify({ format: BACKUP_FORMAT, backupVersion: 1, stores: { history: { version: 1, state: { nope: 1 } } } }), 'damaged'],
  ])('rejects %s without changing anything', (_name, text, message) => {
    seedEverything();
    const before = pick();
    const result = readBackup(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
    expect(pick()).toEqual(before);
  });

  it('knows every store version', () => {
    expect(Object.keys(currentVersions()).sort()).toEqual(['favorites', 'grocery', 'history', 'notes', 'plan', 'preferences']);
  });
});
