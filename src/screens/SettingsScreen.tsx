import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { confirmAction, notify } from '../components/dialogs';
import AllergyPicker from '../components/preferences/AllergyPicker';
import DietPicker from '../components/preferences/DietPicker';
import DislikePicker from '../components/preferences/DislikePicker';
import HouseholdStepper from '../components/preferences/HouseholdStepper';
import MealTypePicker from '../components/preferences/MealTypePicker';
import PantryEditor from '../components/preferences/PantryEditor';
import { usePreferencesStore } from '../store/preferencesStore';
import { colors } from '../theme';
import { AllergenTag, DietId, MealType } from '../types';

const sameSet = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((x) => b.includes(x));

export default function SettingsScreen() {
  const preferences = usePreferencesStore((s) => s);
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences);
  const resetOnboarding = usePreferencesStore((s) => s.resetOnboarding);

  const [household, setHousehold] = useState(preferences.householdSize);
  const [diet, setDiet] = useState<DietId>(preferences.diet);
  const [allergies, setAllergies] = useState<AllergenTag[]>(preferences.allergies);
  const [dislikes, setDislikes] = useState<string[]>(preferences.dislikes);
  const [mealTypes, setMealTypes] = useState<MealType[]>(preferences.mealTypes);

  const hasChanges =
    household !== preferences.householdSize ||
    diet !== preferences.diet ||
    !sameSet(allergies, preferences.allergies) ||
    !sameSet(dislikes, preferences.dislikes) ||
    !sameSet(mealTypes, preferences.mealTypes);

  const handleSave = () => {
    if (mealTypes.length === 0) {
      notify('Pick at least one meal', 'Choose breakfast, lunch, dinner, or snack to plan.');
      return;
    }
    updatePreferences({ householdSize: household, diet, allergies, dislikes, mealTypes });
    notify('Saved', 'Your preferences are up to date.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Preferences</Text>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Section label="Household size">
          <HouseholdStepper value={household} onChange={setHousehold} />
        </Section>
        <Section label="Diet">
          <DietPicker value={diet} onChange={setDiet} />
        </Section>
        <Section label="Allergies">
          <AllergyPicker value={allergies} onChange={setAllergies} />
        </Section>
        <Section label="Ingredients to avoid">
          <DislikePicker value={dislikes} onChange={setDislikes} />
        </Section>
        <Section label="Meal types">
          <MealTypePicker value={mealTypes} onChange={setMealTypes} />
        </Section>
        <Section label="Always in my pantry">
          <PantryEditor />
        </Section>

        <Pressable
          disabled={!hasChanges}
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: hasChanges ? colors.forest : colors.line }]}
          accessibilityRole="button"
        >
          <Text style={[styles.saveLabel, { color: hasChanges ? '#fff' : colors.inkSoft }]}>Save changes</Text>
        </Pressable>

        <Pressable
          onPress={() => confirmAction('Restart onboarding?', 'This clears your saved preferences.', 'Restart', resetOnboarding)}
          style={styles.dangerBtn}
          accessibilityRole="button"
        >
          <Text style={styles.dangerLabel}>Restart onboarding</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest },
  scroll: { padding: 20, gap: 28 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 11.5, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6 },
  saveBtn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  saveLabel: { fontWeight: '700', fontSize: 15 },
  dangerBtn: { paddingVertical: 12, alignItems: 'center' },
  dangerLabel: { color: colors.rust, fontWeight: '600', fontSize: 13.5 },
});
