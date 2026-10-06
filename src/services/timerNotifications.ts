import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Local notifications for cooking timers, so a timer still alerts when the app is backgrounded.
// Web has no reliable local-notification support; the in-app countdown covers it there.

const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Asked the first time a timer starts (not at launch), per the task's permission guidance.
async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function scheduleTimerAlert(title: string, seconds: number): Promise<string | null> {
  if (!supported) return null;
  try {
    if (!(await ensurePermission())) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Timer done', body: title, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(seconds)) },
    });
  } catch (e) {
    console.warn('[timer] could not schedule notification', e);
    return null;
  }
}

export async function cancelTimerAlert(id: string | null): Promise<void> {
  if (!supported || !id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}
