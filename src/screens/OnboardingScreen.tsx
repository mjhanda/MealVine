import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, mealLabels } from '../theme';
import { DietPref, MealType } from '../types';
import { usePreferencesStore } from '../store/preferencesStore';

const DIET_OPTIONS: { id: DietPref; label: string; sub: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian only', sub: 'Plant-based recipes only' },
  { id: 'mixed', label: 'Vegetarian + lean protein', sub: 'Mostly veg, with chicken, turkey & fish — no pork' },
];

const ALL_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MIN_HOUSEHOLD = 1;
const MAX_HOUSEHOLD = 8;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [household, setHousehold] = useState(2);
  const [diet, setDiet] = useState<DietPref>('mixed');
  const [mealTypes, setMealTypes] = useState<MealType[]>(['breakfast', 'lunch', 'dinner', 'snack']);

  const completeOnboarding = usePreferencesStore((s) => s.completeOnboarding);

  const toggleMeal = (m: MealType) =>
    setMealTypes((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));

  const steps = [
    {
      title: 'How many people are you cooking for?',
      canNext: true,
      body: (
        <View style={styles.stepperRow}>
          <Pressable
            onPress={() => setHousehold((h) => Math.max(MIN_HOUSEHOLD, h - 1))}
            style={styles.circleBtn}
          >
            <Feather name="minus" size={18} color={colors.forest} />
          </Pressable>
          <View style={{ alignItems: 'center', minWidth: 60 }}>
            <Text style={styles.householdNumber}>{household}</Text>
            <Text style={styles.householdLabel}>{household === 1 ? 'person' : 'people'}</Text>
          </View>
          <Pressable
            onPress={() => setHousehold((h) => Math.min(MAX_HOUSEHOLD, h + 1))}
            style={styles.circleBtn}
          >
            <Feather name="plus" size={18} color={colors.forest} />
          </Pressable>
        </View>
      ),
    },
    {
      title: 'What should your meals include?',
      canNext: true,
      body: (
        <View style={{ gap: 10, marginTop: 24 }}>
          {DIET_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => setDiet(opt.id)}
              style={[styles.optionCard, diet === opt.id && styles.optionCardActive]}
            >
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionSub}>{opt.sub}</Text>
            </Pressable>
          ))}
        </View>
      ),
    },
    {
      title: 'Which meals do you plan?',
      canNext: mealTypes.length > 0,
      body: (
        <View style={{ gap: 10, marginTop: 24 }}>
          {ALL_MEAL_TYPES.map((id) => {
            const active = mealTypes.includes(id);
            return (
              <Pressable
                key={id}
                onPress={() => toggleMeal(id)}
                style={[styles.mealRow, active && styles.optionCardActive]}
              >
                <Text style={styles.optionLabel}>{mealLabels[id]}</Text>
                {active && <Feather name="check" size={18} color={colors.forest} />}
              </Pressable>
            );
          })}
        </View>
      ),
    },
  ];

  const current = steps[step];
  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    if (!current.canNext) return;
    if (!isLastStep) {
      setStep(step + 1);
      return;
    }
    completeOnboarding({ householdSize: household, diet, mealTypes });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.progressRow}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[styles.progressSegment, { backgroundColor: i <= step ? colors.forest : colors.line }]}
          />
        ))}
      </View>
      <Text style={styles.eyebrow}>Let's set up your plan</Text>
      <Text style={styles.title}>{current.title}</Text>
      <View style={{ flex: 1 }}>{current.body}</View>
      <Pressable
        disabled={!current.canNext}
        onPress={handleNext}
        style={[styles.cta, { backgroundColor: current.canNext ? colors.forest : colors.line }]}
      >
        <Text style={[styles.ctaLabel, { color: current.canNext ? '#fff' : colors.inkSoft }]}>
          {isLastStep ? 'Start planning' : 'Continue'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 28 },
  progressSegment: { flex: 1, height: 4, borderRadius: 4 },
  eyebrow: { fontSize: 15, color: colors.gold, fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest, lineHeight: 30 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 32 },
  circleBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.sageLight,
    alignItems: 'center', justifyContent: 'center',
  },
  householdNumber: { fontSize: 44, fontWeight: '600', color: colors.forest },
  householdLabel: { fontSize: 12, color: colors.inkSoft },
  optionCard: {
    padding: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card,
  },
  optionCardActive: { borderColor: colors.forest, backgroundColor: colors.sageLight },
  optionLabel: { fontWeight: '700', fontSize: 14.5, color: colors.ink },
  optionSub: { fontSize: 12.5, color: colors.inkSoft, marginTop: 2 },
  mealRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card,
  },
  cta: { marginTop: 20, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  ctaLabel: { fontWeight: '700', fontSize: 15 },
});
