import { create } from 'zustand';

// One app-wide undo slot (not persisted), so an undo offered on one screen survives navigating
// to another — e.g. swapping a meal in Browse lands you on the Plan with "Undo" still visible.
interface UndoState {
  current: { id: number; message: string; undo: () => void } | null;
  show: (message: string, undo: () => void) => void;
  dismiss: () => void;
}

let seq = 0;

export const useUndoStore = create<UndoState>()((set) => ({
  current: null,
  show: (message, undo) => set({ current: { id: ++seq, message, undo } }),
  dismiss: () => set({ current: null }),
}));
