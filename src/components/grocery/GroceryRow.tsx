import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';
import { MealUse, mealName, mealSummary, mealsSpoken, rowAccessibilityLabel, ShoppingRow } from '../../utils/shoppingList';

interface Props {
  row: ShoppingRow;
  onToggle: () => void;
  // Trailing action: "I have this" for recipe items, edit for manual items, "Need it" in the pantry.
  action?: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void };
  muted?: boolean;
  onOpenMeal?: (meal: MealUse) => void;
}

export default function GroceryRow({ row, onToggle, action, muted = false, onOpenMeal }: Props) {
  return (
    <View style={[styles.row, muted && styles.rowMuted]}>
      <View style={styles.body}>
        <Pressable
          onPress={onToggle}
          style={styles.main}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: row.checked }}
          accessibilityLabel={rowAccessibilityLabel(row)}
        >
          <View style={[styles.checkbox, row.checked && styles.checkboxChecked]}>
            {row.checked && <Feather name="check" size={13} color="#fff" />}
          </View>
          <View style={styles.nameWrap}>
            <Text style={[styles.name, row.checked && styles.nameChecked]}>{row.name}</Text>
            {row.note && <Text style={styles.note}>{row.note}</Text>}
          </View>
          {row.quantity && <Text style={styles.amount}>{row.quantity}</Text>}
        </Pressable>
        {row.meals.length > 0 && <MealsFor meals={row.meals} onOpenMeal={onOpenMeal} />}
      </View>
      {action ? (
        <Pressable
          onPress={action.onPress}
          style={styles.action}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Feather name={action.icon} size={15} color={colors.inkSoft} />
        </Pressable>
      ) : (
        <View style={styles.actionSpacer} />
      )}
    </View>
  );
}

// "Shrimp Scampi, Lemon Salmon + 1 more" under the item; tap it to see how much each meal needs.
function MealsFor({ meals, onOpenMeal }: { meals: MealUse[]; onOpenMeal?: (meal: MealUse) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.meals}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.summary}
        hitSlop={{ top: 6, bottom: 6 }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`For ${mealsSpoken(meals)}`}
        accessibilityHint={open ? 'Hides how much each meal needs' : 'Shows how much each meal needs'}
      >
        <Text style={styles.summaryText} numberOfLines={1}>
          {mealSummary(meals)}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={13} color={colors.inkSoft} />
      </Pressable>
      {open &&
        meals.map((meal) => (
          <View key={meal.recipeId} style={styles.mealRow}>
            <Pressable
              onPress={() => onOpenMeal?.(meal)}
              disabled={!onOpenMeal}
              style={styles.mealLink}
              hitSlop={{ top: 6, bottom: 6 }}
              accessibilityRole="link"
              accessibilityLabel={`${mealName(meal)}, ${meal.quantity}. Open recipe`}
            >
              <Text style={styles.mealTitle}>{mealName(meal)}</Text>
            </Pressable>
            <Text style={styles.mealAmount}>{meal.quantity}</Text>
          </View>
        ))}
    </View>
  );
}

// Lines the meal list up with the item name (checkbox width + gap).
const NAME_INDENT = 30;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm + 2, paddingLeft: 12,
  },
  rowMuted: { backgroundColor: 'transparent' },
  body: { flex: 1 },
  main: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.sage, borderColor: colors.sage },
  nameWrap: { flex: 1 },
  name: { fontSize: 14, color: colors.ink },
  note: { fontSize: 11.5, color: colors.rustText, marginTop: 2 },
  nameChecked: { color: colors.inkSoft, textDecorationLine: 'line-through' },
  amount: { fontSize: 13, color: colors.inkSoft, fontWeight: '600' },
  meals: { paddingLeft: NAME_INDENT, marginTop: -8, paddingBottom: 6 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  summaryText: { flexShrink: 1, fontSize: 12.5, color: colors.inkSoft },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mealLink: { flex: 1, minHeight: 32, justifyContent: 'center' },
  mealTitle: { fontSize: 13, color: colors.forest, fontWeight: '600' },
  mealAmount: { fontSize: 12.5, color: colors.inkSoft },
  action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  actionSpacer: { width: 12 },
});
