import { Alert, Platform, Share } from 'react-native';

// react-native-web's Alert.alert ignores buttons, so destructive confirmations silently did
// nothing on web. These wrap the native dialog on iOS/Android and the browser dialog on web.

export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

export function notify(title: string, message: string, onDismiss?: () => void): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    onDismiss?.();
    return;
  }
  Alert.alert(title, message, [{ text: 'OK', onPress: onDismiss }]);
}

// Opens the OS share sheet; on desktop web (no navigator.share) copies to the clipboard instead.
export async function shareText(title: string, message: string): Promise<void> {
  if (Platform.OS === 'web') {
    const nav = window.navigator as Navigator & { share?: (data: { title: string; text: string }) => Promise<void> };
    if (nav.share) {
      await nav.share({ title, text: message }).catch(() => undefined);
      return;
    }
    try {
      await nav.clipboard.writeText(message);
      notify('Copied', 'Your list is on the clipboard.');
    } catch {
      notify("Couldn't copy", 'Your browser blocked clipboard access.');
    }
    return;
  }
  await Share.share({ title, message });
}
