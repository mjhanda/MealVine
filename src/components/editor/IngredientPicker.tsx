import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { searchIngredients } from '../../utils/customRecipes';

export type IngredientPick = { id: string } | { custom: string };

interface Props {
  initialQuery?: string;
  onPick: (pick: IngredientPick) => void;
  onCancel: () => void;
}

// Search the ingredient catalog (so the grocery list, nutrition, and allergy checks work), or keep
// what you typed as a free-text ingredient.
export default function IngredientPicker({ initialQuery = '', onPick, onCancel }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const results = searchIngredients(query);
  const typed = query.trim();
  const exact = results.some((d) => d.name.toLowerCase() === typed.toLowerCase());

  return (
    <View style={styles.box}>
      <View style={styles.searchRow}>
        <Feather name="search" size={15} color={colors.inkSoft} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search ingredients"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          autoFocus
          autoCorrect={false}
          accessibilityLabel="Search ingredients"
        />
        <Pressable onPress={onCancel} hitSlop={14} accessibilityRole="button" accessibilityLabel="Close ingredient search">
          <Feather name="x" size={16} color={colors.inkSoft} />
        </Pressable>
      </View>
      {results.map((d) => (
        <Pressable key={d.id} onPress={() => onPick({ id: d.id })} style={styles.result} accessibilityRole="button">
          <Text style={styles.resultName}>{d.name}</Text>
          <Text style={styles.resultAisle}>{d.aisle}</Text>
        </Pressable>
      ))}
      {typed.length > 0 && !exact && (
        <Pressable onPress={() => onPick({ custom: typed })} style={styles.result} accessibilityRole="button">
          <Text style={styles.resultName}>Use “{typed}” as written</Text>
          <Text style={styles.customHint}>Not checked for allergies or nutrition; goes under Other on your list</Text>
        </Pressable>
      )}
      {typed.length === 0 && <Text style={styles.hint}>Type an ingredient, like “onion” or “feta”.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.forest,
    backgroundColor: colors.card, paddingVertical: spacing.xs,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  input: { flex: 1, fontSize: 14, color: colors.ink, paddingVertical: 4 },
  result: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line },
  resultName: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  resultAisle: { fontSize: 11.5, color: colors.inkSoft, marginTop: 1 },
  customHint: { fontSize: 11.5, color: colors.rustText, marginTop: 1 },
  hint: { fontSize: 12.5, color: colors.inkSoft, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
});
