import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../theme';

interface Props<T> {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  label: string; // what the row chooses, for screen readers
}

// A horizontally scrolling single-choice row (meal type, unit, protein) in the recipe editor.
export default function ChipRow<T>({ options, selected, onSelect, label }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <Pressable
            key={o.label}
            onPress={() => onSelect(o.value)}
            hitSlop={{ top: 6, bottom: 6 }}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
          >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexGrow: 0, flexShrink: 0 },
  content: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipLabel: { fontSize: 13, fontWeight: '600', color: colors.ink },
  chipLabelActive: { color: '#fff' },
});
