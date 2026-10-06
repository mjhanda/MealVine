import { Alert, Platform } from 'react-native';

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
