import { Feather } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Recipe } from '../types';
import { totalMinutes } from '../utils/recipeCatalog';
import ProteinTag from './ProteinTag';

interface Props {
  recipe: Recipe;
  onPress: () => void;
  right?: ReactNode;
  servings?: number;
  warning?: string; // e.g. "Contains peanut" — shown when a planned recipe conflicts with preferences
  timesCooked?: number;
  liked?: boolean;
}

export default function RecipeCard({ recipe, onPress, right, servings, warning, timesCooked, liked }: Props) {
  return (
    // The card is a plain container; the recipe area and the `right` actions are sibling
    // pressables. Nesting them would put a <button> inside a <button> on web (invalid, and
    // screen readers can't reach the inner actions).
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={styles.main}
        accessibilityRole="button"
        accessibilityLabel={servings !== undefined ? `${recipe.title}, ${servings} servings` : recipe.title}
      >
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{recipe.emoji}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          <View style={styles.metaRow}>
            <ProteinTag protein={recipe.protein} />
            {totalMinutes(recipe) > 0 && (
              <View style={styles.timeRow}>
                <Feather name="clock" size={12} color={colors.inkSoft} />
                <Text style={styles.timeText}>{totalMinutes(recipe)}m</Text>
              </View>
            )}
            {!!timesCooked && (
              <View style={styles.timeRow} accessibilityLabel={`Cooked ${timesCooked} times`}>
                <Feather name="check-circle" size={12} color={colors.sage} />
                <Text style={styles.timeText}>{timesCooked}×</Text>
              </View>
            )}
            {liked && <Feather name="thumbs-up" size={12} color={colors.sage} accessibilityLabel="You liked this" />}
            {servings !== undefined && (
              <View style={styles.timeRow}>
                <Feather name="users" size={12} color={colors.inkSoft} />
                <Text style={styles.timeText}>{servings}</Text>
              </View>
            )}
          </View>
          {warning && (
            <View style={styles.warningRow}>
              <Feather name="alert-triangle" size={12} color={colors.rust} />
              <Text style={styles.warningText} numberOfLines={2}>
                {warning}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 12,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  body: { flex: 1, minWidth: 0 },
  title: { fontWeight: '700', fontSize: 14.5, color: colors.ink, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeText: { fontSize: 12, color: colors.inkSoft },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  warningText: { fontSize: 12, color: colors.rustText, fontWeight: '600', flexShrink: 1 },
});
