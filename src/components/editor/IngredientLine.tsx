import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { Unit } from '../../types';
import { ingredientLabel, isCustomIngredient, NOT_CHECKED_NOTE } from '../../utils/customIngredients';
import { allowedUnits, IngredientDraft } from '../../utils/customRecipes';
import ChipRow from './ChipRow';

interface Props {
  line: IngredientDraft;
  onChange: (line: IngredientDraft) => void;
  onChangeIngredient: () => void; // opens the picker for this line
  onRemove: () => void;
}

const unitLabel = (u: Unit | null) => u ?? 'each';

// One ingredient in the recipe editor: what it is, how much, which unit (limited to the units that
// ingredient is measured in), and an optional prep note.
export default function IngredientLine({ line, onChange, onChangeIngredient, onRemove }: Props) {
  const name = ingredientLabel(line);
  const custom = isCustomIngredient(line);
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Pressable
          onPress={onChangeIngredient}
          style={styles.nameBtn}
          accessibilityRole="button"
          accessibilityLabel={`${name}. Change ingredient`}
          accessibilityHint={custom ? NOT_CHECKED_NOTE : undefined}
        >
          <Text style={styles.name}>{name}</Text>
          {custom ? (
            <Text style={styles.custom}>{NOT_CHECKED_NOTE} · tap to find it in the list</Text>
          ) : (
            <Text style={styles.change}>Change</Text>
          )}
        </Pressable>
        <Pressable onPress={onRemove} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={`Remove ${name}`}>
          <Feather name="trash-2" size={16} color={colors.inkSoft} />
        </Pressable>
      </View>
      <View style={styles.amountRow}>
        <TextInput
          value={line.amount}
          onChangeText={(amount) => onChange({ ...line, amount })}
          placeholder="1"
          placeholderTextColor={colors.inkSoft}
          style={[styles.input, styles.amountInput]}
          keyboardType="numbers-and-punctuation"
          accessibilityLabel={`Amount of ${name}`}
        />
        <View style={styles.units}>
          <ChipRow
            label={`Unit for ${name}`}
            options={allowedUnits(line.id).map((u) => ({ value: u, label: unitLabel(u) }))}
            selected={line.unit}
            onSelect={(unit) => onChange({ ...line, unit })}
          />
        </View>
      </View>
      <TextInput
        value={line.prep}
        onChangeText={(prep) => onChange({ ...line, prep })}
        placeholder="Prep, e.g. diced (optional)"
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
        accessibilityLabel={`Prep note for ${name}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  nameBtn: { flex: 1, minHeight: 44, justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  change: { fontSize: 12, fontWeight: '600', color: colors.forest, marginTop: 1 },
  custom: { fontSize: 11.5, color: colors.rustText, marginTop: 1 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  amountInput: { width: 64, textAlign: 'center' },
  units: { flex: 1 },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 14, color: colors.ink, backgroundColor: colors.cream,
  },
});
