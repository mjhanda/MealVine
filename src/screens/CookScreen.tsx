import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useKeepAwake } from 'expo-keep-awake';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RatingButtons from '../components/RatingButtons';
import { RootStackParamList } from '../navigation/types';
import { markCooked, undoCooked } from '../store/mealActions';
import { usePlanStore } from '../store/planStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { useRecipeNotesStore } from '../store/recipeNotesStore';
import { useTimerStore } from '../store/timerStore';
import { useUndoStore } from '../store/undoStore';
import { colors, radius, spacing } from '../theme';
import { formatCountdown, stepIngredients, stepMinutes } from '../utils/cooking';
import { ingredientDisplayName, recipeById } from '../utils/recipeCatalog';
import { formatQuantity, scaleAmount } from '../utils/units';

type Props = NativeStackScreenProps<RootStackParamList, 'Cook'>;

// Ticks once a second while a timer is running; idle otherwise.
function useNow(active: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export default function CookScreen({ route, navigation }: Props) {
  useKeepAwake();
  const recipe = recipeById(route.params.recipeId);
  const planItem = usePlanStore((s) => s.plan.items.find((i) => i.id === route.params.planItemId));
  const householdSize = usePreferencesStore((s) => s.householdSize);
  const timer = useTimerStore((s) => s.timer);
  const startTimer = useTimerStore((s) => s.start);
  const stopTimer = useTimerStore((s) => s.stop);
  const showUndo = useUndoStore((s) => s.show);
  const [index, setIndex] = useState(0);
  const note = useRecipeNotesStore((s) => s.notes[route.params.recipeId] ?? '');
  const now = useNow(timer !== null);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.step}>Recipe not found.</Text>
      </SafeAreaView>
    );
  }

  const servings = planItem?.servings ?? householdSize;
  const step = recipe.steps[index];
  const isLast = index === recipe.steps.length - 1;
  const minutes = stepMinutes(step);
  const ingredients = stepIngredients(recipe, step);
  const remaining = timer ? timer.endsAt - now : 0;
  const timerLabel = `${recipe.title}: step ${index + 1}`;

  const finish = () => {
    stopTimer();
    if (!planItem) {
      navigation.goBack();
      return;
    }
    const removed = markCooked(planItem.id);
    if (removed) showUndo(`${recipe.title} marked as cooked`, () => undoCooked(removed));
    // The recipe page we came from was editing this (now cooked) entry, so go back to the plan.
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close cooking mode">
          <Feather name="x" size={24} color={colors.forest} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
        <Text style={styles.counter}>
          {index + 1}/{recipe.steps.length}
        </Text>
      </View>
      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: `${((index + 1) / recipe.steps.length) * 100}%` }]} />
      </View>

      {timer && (
        <View style={[styles.timerBar, remaining <= 0 && styles.timerDone]} accessibilityLiveRegion="polite">
          <Feather name="clock" size={16} color={remaining <= 0 ? colors.cream : colors.forest} />
          <Text style={[styles.timerText, remaining <= 0 && styles.timerTextDone]} numberOfLines={1}>
            {remaining > 0 ? `${formatCountdown(remaining)} · ${timer.label}` : `Time's up · ${timer.label}`}
          </Text>
          <Pressable onPress={stopTimer} hitSlop={10} accessibilityRole="button" accessibilityLabel="Stop timer">
            <Text style={[styles.timerStop, remaining <= 0 && styles.timerTextDone]}>{remaining > 0 ? 'Stop' : 'Dismiss'}</Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body}>
        {index === 0 && note.trim().length > 0 && (
          <View style={styles.noteCard}>
            <Feather name="edit-3" size={14} color={colors.forest} />
            <Text style={styles.noteText}>{note}</Text>
          </View>
        )}
        <Text style={styles.stepLabel}>Step {index + 1}</Text>
        <Text style={styles.step}>{step}</Text>

        {minutes !== null && (!timer || timer.label !== timerLabel) && (
          <Pressable
            onPress={() => startTimer(timerLabel, minutes)}
            style={styles.timerBtn}
            accessibilityRole="button"
            accessibilityLabel={`Start a ${minutes} minute timer`}
          >
            <Feather name="clock" size={16} color={colors.forest} />
            <Text style={styles.timerBtnLabel}>Start {minutes}-min timer</Text>
          </Pressable>
        )}

        {ingredients.length > 0 && (
          <View style={styles.ingredients}>
            <Text style={styles.ingLabel}>For this step</Text>
            {ingredients.map((ing) => {
              const amount = scaleAmount(ing.amount, recipe.servings, servings);
              return (
                <View key={ing.id} style={styles.ingRow}>
                  <Text style={styles.ingName}>{ingredientDisplayName(ing, amount)}</Text>
                  <Text style={styles.ingAmount}>{formatQuantity(amount, ing.unit)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {isLast && (
        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>How was it?</Text>
          <RatingButtons recipeId={recipe.id} size={20} />
        </View>
      )}
      <View style={styles.nav}>
        <Pressable
          onPress={() => setIndex(index - 1)}
          disabled={index === 0}
          style={[styles.navBtn, styles.navBack, index === 0 && styles.navDisabled]}
          accessibilityRole="button"
        >
          <Feather name="chevron-left" size={20} color={colors.forest} />
          <Text style={styles.navBackLabel}>Back</Text>
        </Pressable>
        {isLast ? (
          <Pressable onPress={finish} style={[styles.navBtn, styles.navNext]} accessibilityRole="button">
            <Feather name="check" size={20} color="#fff" />
            <Text style={styles.navNextLabel}>{planItem ? 'Cooked it' : 'Done'}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setIndex(index + 1)} style={[styles.navBtn, styles.navNext]} accessibilityRole="button">
            <Text style={styles.navNextLabel}>Next</Text>
            <Feather name="chevron-right" size={20} color="#fff" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.forest },
  counter: { fontSize: 14, fontWeight: '700', color: colors.inkSoft },
  progress: { height: 4, backgroundColor: colors.line, marginHorizontal: spacing.xl, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: colors.forest },
  timerBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.xl, marginTop: spacing.md,
    padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.goldLight,
  },
  timerDone: { backgroundColor: colors.rustText },
  timerText: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.forest, fontVariant: ['tabular-nums'] },
  timerTextDone: { color: colors.cream },
  timerStop: { fontSize: 14, fontWeight: '800', color: colors.forest },
  body: { padding: spacing.xl, paddingTop: spacing.xxl, gap: spacing.xl },
  stepLabel: { fontSize: 13, fontWeight: '800', color: colors.goldText, textTransform: 'uppercase', letterSpacing: 0.8 },
  step: { fontSize: 24, lineHeight: 34, color: colors.ink, fontWeight: '500' },
  timerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill,
    backgroundColor: colors.sageLight,
  },
  timerBtnLabel: { fontSize: 15, fontWeight: '700', color: colors.forest },
  ingredients: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  ingLabel: { fontSize: 11.5, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6 },
  ingRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  ingName: { flex: 1, fontSize: 16, color: colors.ink },
  ingAmount: { fontSize: 16, fontWeight: '700', color: colors.inkSoft },
  noteCard: {
    flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md,
    backgroundColor: colors.goldLight, alignItems: 'flex-start',
  },
  noteText: { flex: 1, fontSize: 15, color: colors.ink, lineHeight: 21 },
  rateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingTop: spacing.md },
  rateLabel: { fontSize: 15, fontWeight: '700', color: colors.forest },
  nav: { flexDirection: 'row', gap: spacing.md, padding: spacing.xl },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 18, borderRadius: radius.md },
  navBack: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  navNext: { backgroundColor: colors.forest, flex: 2 },
  navDisabled: { opacity: 0.4 },
  navBackLabel: { fontSize: 16, fontWeight: '700', color: colors.forest },
  navNextLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
