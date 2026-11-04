// Tracks whether the user has been active within the last `idleMs`. `poke()` marks activity:
// the first poke after being idle calls `onActive`, and `onIdle` fires once `idleMs` passes with
// no poke. `stop()` ends tracking (calling `onIdle` if still active). Used to keep the screen on
// while a recipe is being read, but not forever if the phone is left on the counter (T50).

export interface IdleTimer {
  poke: () => void;
  stop: () => void;
  isActive: () => boolean;
}

interface Timers {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

const defaultTimers: Timers = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function createIdleTimer(idleMs: number, onActive: () => void, onIdle: () => void, timers: Timers = defaultTimers): IdleTimer {
  let active = false;
  let stopped = false;
  let handle: unknown = null;

  const goIdle = () => {
    handle = null;
    if (!active) return;
    active = false;
    onIdle();
  };

  return {
    poke: () => {
      if (stopped) return;
      if (handle !== null) timers.clearTimeout(handle);
      if (!active) {
        active = true;
        onActive();
      }
      handle = timers.setTimeout(goIdle, idleMs);
    },
    stop: () => {
      if (stopped) return;
      stopped = true;
      if (handle !== null) timers.clearTimeout(handle);
      goIdle();
    },
    isActive: () => active,
  };
}
