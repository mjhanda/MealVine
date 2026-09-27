import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FavoritesState {
  favorites: string[];
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
    {
      name: 'mealplan:favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
