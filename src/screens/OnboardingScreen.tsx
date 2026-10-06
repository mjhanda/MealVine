import React, { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AllergyPicker from '../components/preferences/AllergyPicker';
import DietPicker from '../components/preferences/DietPicker';
import DislikePicker from '../components/preferences/DislikePicker';
import HouseholdStepper from '../components/preferences/HouseholdStepper';
import MealTypePicker from '../components/preferences/MealTypePicker';
import { DEFAULT_PREFERENCES, usePreferencesStore } from '../store/preferencesStore';
import { colors } from '../theme';
import { AllergenTag, DietId, MealType } from '../types';

interface Step {
  title: string;
  hint?: string;
  canNext: boolean;
  body: ReactNode;
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [household, setHousehold] = useState(DEFAULT_PREFERENCES.householdSize);
  const [diet, setDiet] = useState<DietId>(DEFAULT_PREFERENCES.diet);
  const [allergies, setAllergies] = useState<AllergenTag[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [mealTypes, setMealTypes] = useState<MealType[]>(['breakfast', 'lunch', 'dinner', 'snack']);

  const completeOnboarding = usePreferencesStore((s) => s.completeOnboarding);

  const steps: Step[] = [
    {
      title: 'How many people are you cooking for?',
      hint: 'Sets the default servings. You can change it per meal.',
      canNext: true,
      body: <HouseholdStepper value={household} onChange={setHousehold} large />,
    },
    {
      title: 'How do you eat?',
      canNext: true,
      body: <DietPicker value={diet} onChange={setDiet} />,
    },
    {
      title: 'Any allergies?',
      hint: 'Recipes with these never show up. Skip if none.',
      canNext: true,
      body: <AllergyPicker value={allergies} onChange={setAllergies} />,
    },
    {
      title: 'Anything you won’t eat?',
      hint: 'We’ll leave out recipes that use these. Skip if none.',
      canNext: true,
      body: <DislikePicker value={dislikes} onChange={setDislikes} />,
    },
    {
      title: 'Which meals do you plan?',
      canNext: mealTypes.length > 0,
      body: <MealTypePicker value={mealTypes} onChange={setMealTypes} />,
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
    completeOnboarding({ householdSize: household, diet, allergies, dislikes, mealTypes });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.progressRow}>
        {steps.map((_, i) => (
          <View key={i} style={[styles.progressSegment, { backgroundColor: i <= step ? colors.forest : colors.line }]} />
        ))}
      </View>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>{"Let's set up your plan"}</Text>
        {step > 0 && (
          <Pressable onPress={() => setStep(step - 1)} hitSlop={10} accessibilityRole="button">
            <Text style={styles.back}>Back</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.title}>{current.title}</Text>
      {current.hint && <Text style={styles.hint}>{current.hint}</Text>}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        {current.body}
      </ScrollView>
      <Pressable
        disabled={!current.canNext}
        onPress={handleNext}
        style={[styles.cta, { backgroundColor: current.canNext ? colors.forest : colors.line }]}
        accessibilityRole="button"
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  eyebrow: { fontSize: 15, color: colors.gold, fontWeight: '600' },
  back: { fontSize: 14, color: colors.forest, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest, lineHeight: 30 },
  hint: { fontSize: 13.5, color: colors.inkSoft, marginTop: 6 },
  body: { flex: 1, marginTop: 24 },
  bodyContent: { paddingBottom: 12 },
  cta: { marginTop: 12, paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  ctaLabel: { fontWeight: '700', fontSize: 15 },
});
