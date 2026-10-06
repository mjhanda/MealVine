import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import BrowseScreen from '../screens/BrowseScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import GroceryScreen from '../screens/GroceryScreen';
import PlanScreen from '../screens/PlanScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { usePlanStore } from '../store/planStore';
import { colors } from '../theme';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Feather.glyphMap> = {
  Plan: 'clipboard',
  Browse: 'book-open',
  Grocery: 'shopping-cart',
  Favorites: 'heart',
  Settings: 'settings',
};

export default function MainTabs() {
  const planCount = usePlanStore((s) => s.plan.items.length);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        tabBarIcon: ({ color, size }) => (
          <Feather name={ICONS[route.name as keyof MainTabParamList]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{
          tabBarBadge: planCount > 0 ? planCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.gold, color: colors.ink, fontSize: 11 },
        }}
      />
      <Tab.Screen name="Browse" component={BrowseScreen} />
      <Tab.Screen name="Grocery" component={GroceryScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
