import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { USDA_DATASET } from '../data/nutrition/nutritionData';
import { NutrientValues } from '../data/nutrition/types';
import { colors, radius, spacing } from '../theme';
import { Recipe } from '../types';
import { recipeNutrition, roundForLabel } from '../utils/nutrition';
import { ingredientDisplayName } from '../utils/recipeCatalog';

interface Props {
  recipe: Recipe;
  servings: number;
}

const fmt = (key: keyof NutrientValues, v: number) => {
  const n = roundForLabel(key, v);
  if (key === 'kcal') return `${n}`;
  if (key === 'sodium') return `${n} mg`;
  return `${n} g`;
};

const BASIS_LABEL = { usda: '', composite: 'blend of USDA foods', proxy: 'closest USDA food', estimate: 'estimate, not USDA' } as const;

// Nutrition tab: per-serving facts, total for the chosen servings, and the per-ingredient USDA
// data behind them (so every number can be traced to its source).
export default function NutritionPanel({ recipe, servings }: Props) {
  const n = useMemo(() => recipeNutrition(recipe), [recipe]);
  const [showSources, setShowSources] = useState(false);
  const p = n.perServing;
  const approx = new Set([...n.approximate.estimated, ...n.approximate.proxy, ...n.approximate.composite, ...n.approximate.missing]);

  return (
    <View style={styles.wrap}>
      <View style={styles.facts} accessibilityLabel={`Per serving: ${roundForLabel('kcal', p.kcal)} calories`}>
        <Text style={styles.factsTitle}>Per serving</Text>
        <View style={styles.kcalRow}>
          <Text style={styles.kcalLabel}>Calories</Text>
          <Text style={styles.kcalValue}>{fmt('kcal', p.kcal)}</Text>
        </View>
        <View style={styles.rule} />
        <FactRow label="Total fat" value={fmt('fat', p.fat)} />
        <FactRow label="Saturated fat" value={fmt('satFat', p.satFat)} indent />
        <FactRow label="Sodium" value={fmt('sodium', p.sodium)} />
        <FactRow label="Total carbohydrate" value={fmt('carbs', p.carbs)} />
        <FactRow label="Dietary fiber" value={fmt('fiber', p.fiber)} indent />
        <FactRow label="Total sugars" value={fmt('sugar', p.sugar)} indent />
        <FactRow label="Protein" value={fmt('protein', p.protein)} last />
      </View>

      {servings !== 1 && (
        <Text style={styles.total}>
          All {servings} servings: {fmt('kcal', p.kcal * servings)} calories · {fmt('protein', p.protein * servings)} protein
        </Text>
      )}

      <Text style={styles.sectionHeader}>By ingredient (per serving)</Text>
      <View style={styles.table} accessibilityRole="list">
        <View style={[styles.tr, styles.th]}>
          <Text style={[styles.cell, styles.cName, styles.thText]}>Ingredient</Text>
          <Text style={[styles.cell, styles.thText]}>g</Text>
          <Text style={[styles.cell, styles.thText]}>kcal</Text>
          <Text style={[styles.cell, styles.thText]}>Prot</Text>
          <Text style={[styles.cell, styles.thText]}>Carb</Text>
          <Text style={[styles.cell, styles.thText]}>Fat</Text>
        </View>
        {n.rows.map((row) => (
          <View key={row.ingredient.id} style={styles.tr}>
            <Text style={[styles.cell, styles.cName]} numberOfLines={2}>
              {ingredientDisplayName(row.ingredient, row.ingredient.amount)}
              {approx.has(row.ingredient.id) ? ' ≈' : ''}
            </Text>
            <Text style={styles.cell}>{row.grams === null ? '—' : Math.round(row.grams)}</Text>
            <Text style={styles.cell}>{Math.round(row.values.kcal)}</Text>
            <Text style={styles.cell}>{row.values.protein.toFixed(1)}</Text>
            <Text style={styles.cell}>{row.values.carbs.toFixed(1)}</Text>
            <Text style={styles.cell}>{row.values.fat.toFixed(1)}</Text>
          </View>
        ))}
      </View>

      <Pressable onPress={() => setShowSources((v) => !v)} hitSlop={10} accessibilityRole="button" accessibilityState={{ expanded: showSources }}>
        <Text style={styles.link}>{showSources ? 'Hide data sources' : 'Show data sources'}</Text>
      </Pressable>
      {showSources && (
        <View style={styles.sources}>
          {n.rows.map(({ ingredient, source }) => (
            <Text key={ingredient.id} style={styles.sourceText}>
              <Text style={styles.sourceName}>{ingredientDisplayName(ingredient, ingredient.amount)}: </Text>
              {source?.foods.length
                ? source.foods.map((f) => `${f.description} (FDC ${f.fdcId})`).join(' + ')
                : 'no USDA entry'}
              {source && BASIS_LABEL[source.basis] ? ` — ${BASIS_LABEL[source.basis]}` : ''}
              {source?.note ? `. ${source.note}` : ''}
              {source?.missing?.length ? `. USDA lists no ${source.missing.join('/')} value (counted as 0)` : ''}
            </Text>
          ))}
        </View>
      )}

      <Text style={styles.footnote}>
        Estimated from {USDA_DATASET.name} ({USDA_DATASET.release}), public-domain data from the U.S. Department of
        Agriculture. {approx.size > 0 ? '≈ marks ingredients that use a blend, a close match, or an estimate. ' : ''}
        Values vary by brand and preparation; not medical advice.
      </Text>
    </View>
  );
}

function FactRow({ label, value, indent = false, last = false }: { label: string; value: string; indent?: boolean; last?: boolean }) {
  return (
    <View style={[styles.factRow, !last && styles.factBorder]}>
      <Text style={[styles.factLabel, indent && styles.factIndent]}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, marginTop: spacing.lg },
  facts: { borderWidth: 2, borderColor: colors.ink, borderRadius: radius.sm, padding: spacing.md, backgroundColor: colors.card },
  factsTitle: { fontSize: 13, fontWeight: '800', color: colors.ink, textTransform: 'uppercase', letterSpacing: 0.6 },
  kcalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 },
  kcalLabel: { fontSize: 22, fontWeight: '800', color: colors.ink },
  kcalValue: { fontSize: 28, fontWeight: '800', color: colors.ink },
  rule: { height: 4, backgroundColor: colors.ink, marginVertical: 6 },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  factBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  factLabel: { fontSize: 14, fontWeight: '700', color: colors.ink },
  factIndent: { fontWeight: '400', paddingLeft: spacing.lg },
  factValue: { fontSize: 14, color: colors.ink },
  total: { fontSize: 13, color: colors.inkSoft, textAlign: 'center' },
  sectionHeader: {
    fontWeight: '800', fontSize: 13, color: colors.forest, marginTop: spacing.md,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  table: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.card },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line },
  th: { borderTopWidth: 0, backgroundColor: colors.sageLight },
  thText: { fontWeight: '800', color: colors.forest },
  cell: { width: 42, fontSize: 12, color: colors.ink, textAlign: 'right', fontVariant: ['tabular-nums'] },
  cName: { flex: 1, width: undefined, textAlign: 'left', paddingRight: spacing.xs },
  link: { fontSize: 13, fontWeight: '700', color: colors.forest },
  sources: { gap: 6 },
  sourceText: { fontSize: 12, color: colors.inkSoft, lineHeight: 17 },
  sourceName: { fontWeight: '700', color: colors.ink },
  footnote: { fontSize: 11.5, color: colors.inkSoft, lineHeight: 16 },
});
