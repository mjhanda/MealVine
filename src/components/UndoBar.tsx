import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUndoStore } from '../store/undoStore';
import { colors, radius, spacing } from '../theme';

export const UNDO_TIMEOUT_MS = 6000;

// Clears the bottom tab bar (~49pt + home indicator) so the bar never covers navigation.
const TAB_BAR_CLEARANCE = 64;

// Rendered once, at the root; screens call useUndoStore.getState().show(message, undo).
export default function UndoBar() {
  const current = useUndoStore((s) => s.current);
  const dismiss = useUndoStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();
  const id = current?.id ?? null;

  useEffect(() => {
    if (id === null) return;
    const timer = setTimeout(dismiss, UNDO_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [id, dismiss]);

  if (!current) return null;
  return (
    <View style={[styles.bar, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]} accessibilityLiveRegion="polite">
      <Text style={styles.message} numberOfLines={2}>
        {current.message}
      </Text>
      <Pressable
        onPress={() => {
          current.undo();
          dismiss();
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
    position: 'absolute', left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.forest, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
  },
  message: { flex: 1, color: colors.cream, fontSize: 14 },
  action: { color: colors.goldLight, fontWeight: '800', fontSize: 14 },
});
