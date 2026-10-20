import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { SauceOption } from '../utils/homemade';
import { ingredientDisplayName } from '../utils/recipeCatalog';
import { formatQuantity } from '../utils/units';

interface Props {
  option: SauceOption;
  buy: boolean;
  batches: number; // when making it: whole batches of the sauce recipe this needs
  onChange: (buy: boolean) => void;
  onOpenRecipe: () => void;
}

// Under a bottled sauce in a recipe: make it from scratch (with a link to how) or buy it to save
// time. The choice decides what goes on the grocery list and whether cooking mode starts with it.
export default function SauceChoice({ option, buy, batches, onChange, onOpenRecipe }: Props) {
  const minutes = option.sauce.prep + option.sauce.cook;
  const choices = [
    { buy: false, label: 'Make it', hint: `${minutes} min` },
    { buy: true, label: 'Buy it', hint: 'saves time' },
  ];
  return (
    <View style={styles.box}>
      <View style={styles.segment} accessibilityRole="radiogroup">
        {choices.map((c) => {
          const active = buy === c.buy;
          return (
            <Pressable
              key={c.label}
              onPress={() => onChange(c.buy)}
              style={[styles.option, active && styles.optionActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${c.label}, ${c.hint}`}
            >
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{c.label}</Text>
              <Text style={[styles.optionHint, active && styles.optionLabelActive]}>{c.hint}</Text>
            </Pressable>
          );
        })}
      </View>
      {!buy && (
        <>
          <Text style={styles.needLabel}>
            For the {option.sauce.title}{batches > 1 ? ` (${batches} batches)` : ''}:
          </Text>
          {option.sauce.ingredients.map((ing, i) => {
            const amount = ing.amount * batches;
            return (
              <View key={i} style={styles.needRow}>
                <Text style={styles.needName}>{ingredientDisplayName(ing, amount)}</Text>
                <Text style={styles.needAmount}>{formatQuantity(amount, ing.unit)}</Text>
              </View>
            );
          })}
          <Pressable onPress={onOpenRecipe} style={styles.link} accessibilityRole="link" hitSlop={8}>
            <Text style={styles.linkText}>Open the {option.sauce.title} recipe</Text>
            <Feather name="chevron-right" size={14} color={colors.forest} />
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { paddingTop: 4, paddingBottom: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  segment: {
    flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.card, padding: 3,
  },
  option: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
  optionActive: { backgroundColor: colors.forest },
  optionLabel: { fontSize: 13, fontWeight: '700', color: colors.ink },
  optionHint: { fontSize: 11.5, color: colors.inkSoft },
  optionLabelActive: { color: '#fff' },
  needLabel: { fontSize: 12.5, fontWeight: '700', color: colors.inkSoft, marginTop: 2 },
  needRow: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 12 },
  needName: { flex: 1, fontSize: 13, color: colors.ink, marginRight: 12 },
  needAmount: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: 28 },
  linkText: { fontSize: 13, fontWeight: '700', color: colors.forest },
});
