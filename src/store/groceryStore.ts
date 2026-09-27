import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ManualGroceryItem } from '../types';

interface GroceryStoreState {
  checked: Record<string, boolean>;
  manualItems: ManualGroceryItem[];
  toggleCheck: (key: string) => void;
  addManual: (name: string) => void;
  removeManual: (id: string) => void;
  clearChecked: () => void;
}

export const useGroceryStore = create<GroceryStoreState>()(
  persist(
    (set) => ({
      checked: {},
      manualItems: [],
      toggleCheck: (key) =>
        set((state) => ({ checked: { ...state.checked, [key]: !state.checked[key] } })),
      addManual: (name) =>
        set((state) => ({
          manualItems: [
            ...state.manualItems,
            { id: `manual-${Date.now()}`, name, category: 'Pantry & Canned' },
          ],
        })),
      removeManual: (id) =>
        set((state) => ({ manualItems: state.manualItems.filter((m) => m.id !== id) })),
      clearChecked: () => set({ checked: {} }),
    }),
    {
      name: 'mealplan:grocery',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
