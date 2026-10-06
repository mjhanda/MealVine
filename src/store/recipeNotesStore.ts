import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isRecord, MigrationError, persistOptions } from './persistence';

export type Rating = 'up' | 'down';

interface PersistedNotes {
  notes: Record<string, string>; // recipeId → private note
  ratings: Record<string, Rating>; // recipeId → thumbs
}

export const NOTES_VERSION = 1;

export function migrateNotes(persisted: unknown, _fromVersion: number): PersistedNotes {
  if (!isRecord(persisted)) throw new MigrationError('notes: not an object');
  return {
    notes: isRecord(persisted.notes) ? (persisted.notes as Record<string, string>) : {},
    ratings: isRecord(persisted.ratings) ? (persisted.ratings as Record<string, Rating>) : {},
  };
}

interface NotesState extends PersistedNotes {
  setNote: (recipeId: string, note: string) => void;
  // Tapping the current rating again clears it.
  rate: (recipeId: string, rating: Rating) => void;
}

const without = <T,>(record: Record<string, T>, key: string): Record<string, T> => {
  const { [key]: _removed, ...rest } = record;
  return rest;
};

export const useRecipeNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: {},
      ratings: {},
      setNote: (recipeId, note) =>
        set((state) => ({
          notes: note.trim() ? { ...state.notes, [recipeId]: note } : without(state.notes, recipeId),
        })),
      rate: (recipeId, rating) =>
        set((state) => ({
          ratings: state.ratings[recipeId] === rating ? without(state.ratings, recipeId) : { ...state.ratings, [recipeId]: rating },
        })),
    }),
    persistOptions<NotesState, PersistedNotes>({
      name: 'mealplan:notes',
      version: NOTES_VERSION,
      partialize: ({ notes, ratings }) => ({ notes, ratings }),
      migrate: migrateNotes,
      onHydrated: () => {},
    })
  )
);
