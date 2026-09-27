import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeCard from '../components/RecipeCard';
import { RootStackParamList } from '../navigation/types';
import { useFavoritesStore } from '../store/favoritesStore';
import { usePlanStore } from '../store/planStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { colors, days, mealLabels } from '../theme';
import { Day, MealType } from '../types';
import { recipeById } from '../utils/planGenerator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PlanScreen() {
  const navigation = useNavigation<Nav>();
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const activeDay = days[activeDayIndex] as Day;

  const plan = usePlanStore((s) => s.plan);
  const swap = usePlanStore((s) => s.swap);
  const regenerate = usePlanStore((s) => s.regenerate);
  const preferences = usePreferencesStore((s) => s);
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  const entries = plan?.entries[activeDay] || {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>This week</Text>
          <Text style={styles.title}>Your meal plan</Text>
        </View>
        <Pressable
          onPress={() => regenerate(preferences.mealTypes, preferences.diet)}
          style={styles.iconBtn}
        >
          <Feather name="refresh-cw" size={16} color={colors.forest} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow} contentContainerStyle={{ gap: 8 }}>
        {days.map((d, i) => {
          const active = i === activeDayIndex;
          return (
            <Pressable
              key={d}
              onPress={() => setActiveDayIndex(i)}
              style={[styles.dayPill, active ? { backgroundColor: colors.forest } : styles.dayPillInactive]}
            >
              <Text style={[styles.dayLabel, { color: active ? '#fff' : colors.ink }]}>{d}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.list} contentContainerStyle={{ padding: 20, gap: 14 }}>
        {preferences.mealTypes.length === 0 && (
          <Text style={styles.emptyText}>No meal types selected. Update this in Settings.</Text>
        )}
        {preferences.mealTypes.map((mealType: MealType) => {
          const recipeId = entries[mealType];
          const recipe = recipeById(recipeId);
          if (!recipe) return null;
          return (
            <View key={mealType}>
              <Text style={styles.mealLabel}>{mealLabels[mealType]}</Text>
              <RecipeCard
                recipe={recipe}
                onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id, day: activeDay, mealType })}
                right={
                  <View style={{ gap: 10, alignItems: 'center' }}>
                    <Pressable onPress={() => toggleFavorite(recipe.id)} hitSlop={8}>
                      <Ionicons
                        name={favorites.includes(recipe.id) ? 'heart' : 'heart-outline'}
                        size={18}
                        color={colors.rust}
                      />
                    </Pressable>
                    <Pressable onPress={() => swap(activeDay, mealType, preferences.diet)} hitSlop={8}>
                      <Feather name="refresh-cw" size={15} color={colors.inkSoft} />
                    </Pressable>
                  </View>
                }
              />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  dayRow: { marginTop: 16, paddingHorizontal: 20, flexGrow: 0 },
  dayPill: { minWidth: 46, paddingVertical: 9, borderRadius: 12, alignItems: 'center' },
  dayPillInactive: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  dayLabel: { fontWeight: '700', fontSize: 13 },
  list: { flex: 1 },
  mealLabel: { fontSize: 11.5, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  emptyText: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', marginTop: 40 },
});
