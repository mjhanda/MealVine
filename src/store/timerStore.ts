import { create } from 'zustand';
import { cancelTimerAlert, scheduleTimerAlert } from '../services/timerNotifications';

// One cooking timer at a time (not persisted). Lives outside the Cook screen so it keeps
// running while you flip between steps.
interface Timer {
  label: string;
  endsAt: number;
  notificationId: string | null;
}

interface TimerState {
  timer: Timer | null;
  start: (label: string, minutes: number, now?: number) => void;
  stop: () => void;
}

export const useTimerStore = create<TimerState>()((set, get) => ({
  timer: null,
  start: (label, minutes, now = Date.now()) => {
    const previous = get().timer;
    if (previous) cancelTimerAlert(previous.notificationId);
    set({ timer: { label, endsAt: now + minutes * 60_000, notificationId: null } });
    scheduleTimerAlert(label, minutes * 60).then((notificationId) => {
      const current = get().timer;
      if (current && current.label === label) set({ timer: { ...current, notificationId } });
      else cancelTimerAlert(notificationId); // stopped or replaced before scheduling finished
    });
  },
  stop: () => {
    const current = get().timer;
    if (current) cancelTimerAlert(current.notificationId);
    set({ timer: null });
  },
}));
