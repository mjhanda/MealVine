import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isRecord, MigrationError, persistOptions } from './persistence';

interface PersistedFavorites {
  favorites: string[];
}

export const FAVORITES_VERSION = 1;

// v0 → v1: no shape change; establishes versioning.
export function migrateFavorites(persisted: unknown, _fromVersion: number): PersistedFavorites {
  if (!isRecord(persisted)) throw new MigrationError('favorites: not an object');
  const favorites = Array.isArray(persisted.favorites) ? persisted.favorites : [];
  return { favorites: favorites.filter((id): id is string => typeof id === 'string') };
}

interface FavoritesState extends PersistedFavorites {
  toggleFavorite: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (recipeId) =>
        set((state) => ({
          favorites: state.favorites.includes(recipeId)
            ? state.favorites.filter((id) => id !== recipeId)
            : [...state.favorites, recipeId],
        })),
      isFavorite: (recipeId) => get().favorites.includes(recipeId),
    }),
    persistOptions<FavoritesState, PersistedFavorites>({
      name: 'mealplan:favorites',
      version: FAVORITES_VERSION,
      partialize: ({ favorites }) => ({ favorites }),
      migrate: migrateFavorites,
      onHydrated: () => {},
    })
  )
);
