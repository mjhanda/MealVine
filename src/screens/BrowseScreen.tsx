import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeCard from '../components/RecipeCard';
import { RECIPES } from '../data/recipes';
import { RootStackParamList } from '../navigation/types';
import { colors, mealLabels } from '../theme';
import { MealType } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTERS: { id: MealType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'breakfast', label: mealLabels.breakfast },
  { id: 'lunch', label: mealLabels.lunch },
  { id: 'dinner', label: mealLabels.dinner },
];

export default function BrowseScreen() {
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<MealType | 'all'>('all');

  const recipes = useMemo(
    () => (filter === 'all' ? RECIPES : RECIPES.filter((r) => r.mealType === filter)),
    [filter]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Browse</Text>
        <Text style={styles.title}>All recipes</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filterPill, active ? { backgroundColor: colors.forest } : styles.filterPillInactive]}
            >
              <Text style={[styles.filterLabel, { color: active ? '#fff' : colors.ink }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12, gap: 10 }}>
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest },
  filterRow: { marginTop: 14, paddingHorizontal: 20, flexGrow: 0 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterPillInactive: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  filterLabel: { fontWeight: '700', fontSize: 13 },
});
