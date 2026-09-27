import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlanStore } from '../store/planStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { colors, mealLabels } from '../theme';
import { DietPref, MealType } from '../types';

const DIET_OPTIONS: { id: DietPref; label: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian only' },
  { id: 'mixed', label: 'Vegetarian + lean protein' },
];
const ALL_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];
const MIN_HOUSEHOLD = 1;
const MAX_HOUSEHOLD = 8;

export default function SettingsScreen() {
  const preferences = usePreferencesStore((s) => s);
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences);
  const resetOnboarding = usePreferencesStore((s) => s.resetOnboarding);
  const regenerate = usePlanStore((s) => s.regenerate);

  const [household, setHousehold] = useState(preferences.householdSize);
  const [diet, setDiet] = useState<DietPref>(preferences.diet);
  const [mealTypes, setMealTypes] = useState<MealType[]>(preferences.mealTypes);

  const toggleMeal = (m: MealType) =>
    setMealTypes((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));

  const hasChanges =
    household !== preferences.householdSize ||
    diet !== preferences.diet ||
    mealTypes.length !== preferences.mealTypes.length ||
    mealTypes.some((m) => !preferences.mealTypes.includes(m));

  const handleSave = () => {
    if (mealTypes.length === 0) {
      Alert.alert('Pick at least one meal', 'Choose breakfast, lunch, or dinner to plan.');
      return;
    }
    updatePreferences({ householdSize: household, diet, mealTypes });
    Alert.alert('Regenerate your plan?', 'Your preferences changed. Rebuild this week’s plan to match?', [
      { text: 'Not now', style: 'cancel' },
      { text: 'Regenerate', onPress: () => regenerate(mealTypes, diet) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Preferences</Text>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
        <View>
          <Text style={styles.sectionLabel}>Household size</Text>
          <View style={styles.stepperRow}>
            <Pressable onPress={() => setHousehold((h) => Math.max(MIN_HOUSEHOLD, h - 1))} style={styles.circleBtn}>
              <Feather name="minus" size={16} color={colors.forest} />
            </Pressable>
            <Text style={styles.householdValue}>{household}</Text>
            <Pressable onPress={() => setHousehold((h) => Math.min(MAX_HOUSEHOLD, h + 1))} style={styles.circleBtn}>
              <Feather name="plus" size={16} color={colors.forest} />
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Diet</Text>
          <View style={{ gap: 10, marginTop: 10 }}>
            {DIET_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => setDiet(opt.id)}
                style={[styles.optionCard, diet === opt.id && styles.optionCardActive]}
              >
                <Text style={styles.optionLabel}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Meals to plan</Text>
          <View style={{ gap: 10, marginTop: 10 }}>
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
        </View>

        <Pressable
          disabled={!hasChanges}
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: hasChanges ? colors.forest : colors.line }]}
        >
          <Text style={[styles.saveLabel, { color: hasChanges ? '#fff' : colors.inkSoft }]}>Save changes</Text>
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert('Restart onboarding?', 'This clears your saved preferences.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Restart', style: 'destructive', onPress: resetOnboarding },
            ])
          }
          style={styles.dangerBtn}
        >
          <Text style={styles.dangerLabel}>Restart onboarding</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest },
  sectionLabel: { fontSize: 11.5, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  circleBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sageLight,
    alignItems: 'center', justifyContent: 'center',
  },
  householdValue: { fontSize: 20, fontWeight: '700', color: colors.forest, minWidth: 20, textAlign: 'center' },
  optionCard: { padding: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card },
  optionCardActive: { borderColor: colors.forest, backgroundColor: colors.sageLight },
  optionLabel: { fontWeight: '700', fontSize: 14.5, color: colors.ink },
  mealRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card,
  },
  saveBtn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  saveLabel: { fontWeight: '700', fontSize: 15 },
  dangerBtn: { paddingVertical: 12, alignItems: 'center' },
  dangerLabel: { color: colors.rust, fontWeight: '600', fontSize: 13.5 },
});
