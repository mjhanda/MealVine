import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeCard from '../components/RecipeCard';
import { RootStackParamList } from '../navigation/types';
import { useUserRecipes } from '../store/customRecipesStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useHistoryStore } from '../store/historyStore';
import { useEatingPrefs } from '../store/preferencesStore';
import { useRecipeNotesStore } from '../store/recipeNotesStore';
import { colors } from '../theme';
import { isExcluded, recipeConflicts } from '../utils/diets';
import { cookStats } from '../utils/history';
import { allRecipes } from '../utils/recipeCatalog';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortMode = 'recent' | 'az';

export default function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const favorites = useFavoritesStore((s) => s.favorites);
  const history = useHistoryStore((s) => s.cooked);
  const ratings = useRecipeNotesStore((s) => s.ratings);
  const prefs = useEatingPrefs();
  const [sort, setSort] = useState<SortMode>('recent');
  useUserRecipes(); // re-render when your own recipes change

  const stats = useMemo(() => cookStats(history), [history]);
  const saved = allRecipes().filter((r) => favorites.includes(r.id));
  // Allergens/dislikes hide favorites too; say how many so nothing silently disappears.
  const visible = saved.filter((r) => !isExcluded(recipeConflicts(r, prefs)));
  const hiddenCount = saved.length - visible.length;
  // "Recently cooked": most recent first, never-cooked last (alphabetical among themselves).
  const sorted = [...visible].sort((a, b) =>
    sort === 'recent'
      ? (stats.get(b.id)?.lastCookedAt ?? 0) - (stats.get(a.id)?.lastCookedAt ?? 0) || a.title.localeCompare(b.title)
      : a.title.localeCompare(b.title)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Saved</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Favorites</Text>
          {visible.length > 1 && (
            <View style={styles.sortRow} accessibilityRole="radiogroup">
              {(['recent', 'az'] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setSort(mode)}
                  hitSlop={{ top: 8, bottom: 8 }}
                  style={[styles.sortPill, sort === mode && styles.sortPillActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: sort === mode }}
                >
                  <Text style={[styles.sortLabel, sort === mode && styles.sortLabelActive]}>
                    {mode === 'recent' ? 'Recently cooked' : 'A–Z'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
        {saved.length === 0 && <Text style={styles.emptyText}>Tap the heart on any recipe to save it here.</Text>}
        {hiddenCount > 0 && (
          <Text style={styles.hiddenNote}>
            {hiddenCount} saved recipe{hiddenCount === 1 ? '' : 's'} hidden because of your allergies or avoided
            ingredients.
          </Text>
        )}
        {sorted.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            timesCooked={stats.get(recipe.id)?.times}
            liked={ratings[recipe.id] === 'up'}
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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 13, color: colors.goldText, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest },
  sortRow: { flexDirection: 'row', gap: 6 },
  sortPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  sortPillActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  sortLabel: { fontSize: 12, fontWeight: '600', color: colors.inkSoft },
  sortLabelActive: { color: '#fff' },
  hiddenNote: { color: colors.inkSoft, fontSize: 12.5, textAlign: 'center' },
  emptyText: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', marginTop: 40 },
});
