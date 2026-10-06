import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { initPurchases } from './src/services/purchases';
import { startPlanGrocerySync } from './src/store/planGrocerySync';

startPlanGrocerySync();
initPurchases();

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
