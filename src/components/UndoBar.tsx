import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export const UNDO_TIMEOUT_MS = 4000;

interface Props {
  // Changing `id` restarts the timer, so back-to-back actions each get their full window.
  id: string | number | null;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function UndoBar({ id, message, onUndo, onDismiss }: Props) {
  useEffect(() => {
    if (id === null) return;
    const timer = setTimeout(onDismiss, UNDO_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  if (id === null) return null;
  return (
    <View style={styles.bar} accessibilityLiveRegion="polite">
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <Pressable
        onPress={() => {
          onUndo();
          onDismiss();
        }}
        hitSlop={12}
        accessibilityRole="button"
      >
        <Text style={styles.action}>Undo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.forest, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
  },
  message: { flex: 1, color: colors.cream, fontSize: 14 },
  action: { color: colors.goldLight, fontWeight: '800', fontSize: 14 },
});
