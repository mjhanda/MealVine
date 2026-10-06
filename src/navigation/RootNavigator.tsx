import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { notify } from '../components/dialogs';
import UndoBar from '../components/UndoBar';
import OnboardingScreen from '../screens/OnboardingScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import { useStorageHealth } from '../store/persistence';
import { usePlanStore } from '../store/planStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { colors } from '../theme';
import MainTabs from './MainTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const prefsHydrated = usePreferencesStore((s) => s.hasHydrated);
  const planHydrated = usePlanStore((s) => s.hasHydrated);
  const hasHydrated = prefsHydrated && planHydrated;
  const onboardingComplete = usePreferencesStore((s) => s.onboardingComplete);
  const failedStores = useStorageHealth((s) => s.failedStores);
  const dismissStorageFailure = useStorageHealth((s) => s.dismiss);

  useEffect(() => {
    if (!hasHydrated || failedStores.length === 0) return;
    notify(
      "Some saved data couldn't be loaded",
      'The app started fresh for those parts. A backup copy was kept on this device.',
      dismissStorageFailure
    );
  }, [hasHydrated, failedStores, dismissStorageFailure]);

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.forest} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
      <UndoBar />
    </NavigationContainer>
  );
}
