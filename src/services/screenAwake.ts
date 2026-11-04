import { useIsFocused } from '@react-navigation/native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { createIdleTimer, IdleTimer } from '../utils/idleTimer';

// How long the recipe page keeps the screen on after the last touch or scroll (T50).
export const RECIPE_AWAKE_MS = 5 * 60 * 1000;

// Keeping the screen on is a convenience: if the platform refuses (some browsers, low-power
// modes), the phone just sleeps as it normally would, so a failure is reported and moved past.
const report = (err: unknown) => console.warn('[screenAwake]', err);

function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}

// Keeps the screen on while this screen is focused and the app is in front, until `idleMs` pass
// with no activity. Returns `poke`: call it on touches/scrolls to restart the window. `tag` keeps
// this lock separate from cooking mode's own.
export function useIdleKeepAwake(tag: string, idleMs: number): () => void {
  const focused = useIsFocused();
  const appActive = useAppActive();
  const timer = useRef<IdleTimer | null>(null);

  useEffect(() => {
    if (!focused || !appActive) return;
    const t = createIdleTimer(
      idleMs,
      () => activateKeepAwakeAsync(tag).catch(report),
      () => deactivateKeepAwake(tag).catch(report)
    );
    timer.current = t;
    t.poke();
    return () => {
      t.stop();
      timer.current = null;
    };
  }, [focused, appActive, tag, idleMs]);

  return useCallback(() => timer.current?.poke(), []);
}
