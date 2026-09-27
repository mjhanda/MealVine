import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { usePlanStore } from './src/store/planStore';
import { usePreferencesStore } from './src/store/preferencesStore';

export default function App() {
  const prefsHydrated = usePreferencesStore((s) => s.hasHydrated);
  const onboardingComplete = usePreferencesStore((s) => s.onboardingComplete);
  const mealTypes = usePreferencesStore((s) => s.mealTypes);
  const diet = usePreferencesStore((s) => s.diet);
  const planHydrated = usePlanStore((s) => s.hasHydrated);
  const plan = usePlanStore((s) => s.plan);
  const regenerate = usePlanStore((s) => s.regenerate);

  useEffect(() => {
    if (prefsHydrated && planHydrated && onboardingComplete && !plan) {
      regenerate(mealTypes, diet);
    }
  }, [prefsHydrated, planHydrated, onboardingComplete, plan, mealTypes, diet, regenerate]);

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
