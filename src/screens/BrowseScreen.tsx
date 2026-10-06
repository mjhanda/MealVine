import { Feather } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeCard from '../components/RecipeCard';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { usePlanStore } from '../store/planStore';
import { useEatingPrefs, usePreferencesStore } from '../store/preferencesStore';
import { useUndoStore } from '../store/undoStore';
import { colors, mealLabels, mealTypeOrder } from '../theme';
import { MealType } from '../types';
import { DIETS } from '../utils/diets';
import { filterRecipes, recipeById } from '../utils/recipeCatalog';

type Nav = NativeStackNavigationProp<RootStackParamList & MainTabParamList>;

export default function BrowseScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<MainTabParamList, 'Browse'>>();
  const mealTypes = usePreferencesStore((s) => s.mealTypes);
  const prefs = useEatingPrefs();
  const householdSize = usePreferencesStore((s) => s.householdSize);
  const plan = usePlanStore((s) => s.plan);
  const addItem = usePlanStore((s) => s.addItem);
  const removeItem = usePlanStore((s) => s.removeItem);
  const restoreItem = usePlanStore((s) => s.restoreItem);
  const replaceRecipe = usePlanStore((s) => s.replaceRecipe);

  // Swap mode: picking a replacement for one plan entry, locked to its meal type.
  const swapItem = plan.items.find((i) => i.id === route.params?.swapItemId);
  const swapRecipe = swapItem && recipeById(swapItem.recipeId);
  const endSwap = () => navigation.setParams({ swapItemId: undefined });

  const showUndo = useUndoStore((s) => s.show);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MealType | 'all'>('all');
  const [showAllDiets, setShowAllDiets] = useState(false);

  const chips: { id: MealType | 'all'; label: string }[] = useMemo(() => {
    const selected = mealTypes.length > 0 ? mealTypes : mealTypeOrder;
    return [
      { id: 'all' as const, label: 'All' },
      ...selected.map((id) => ({ id, label: mealLabels[id] })),
    ];
  }, [mealTypes]);

  const mealType = swapRecipe ? swapRecipe.mealType : filter;
  const recipes = useMemo(
    () =>
      filterRecipes({ mealType, query: search, prefs, showAllDiets }).filter((r) => r.id !== swapRecipe?.id),
    [mealType, prefs, showAllDiets, search, swapRecipe]
  );

  const handleSwap = (recipeId: string, title: string) => {
    if (!swapItem) return;
    const previous = swapItem.recipeId;
    replaceRecipe(swapItem.id, recipeId);
    endSwap();
    navigation.navigate('Plan');
    showUndo(`Swapped in ${title}`, () => replaceRecipe(swapItem.id, previous));
  };

  // ✓ toggles off: removes the most recently added entry for that recipe.
  const handleToggle = (recipeId: string, title: string) => {
    const entries = plan.items.filter((i) => i.recipeId === recipeId);
    const latest = entries[entries.length - 1];
    if (!latest) {
      const id = addItem(recipeId, householdSize);
      showUndo(`${title} added to your plan`, () => removeItem(id));
      return;
    }
    removeItem(latest.id);
    showUndo(`${title} removed from your plan`, () => restoreItem(latest));
  };

  const inPlanCounts = useMemo(() => {
    const counts = new Map<string, number>();
    plan.items.forEach((item) =>
      counts.set(item.recipeId, (counts.get(item.recipeId) || 0) + 1)
    );
    return counts;
  }, [plan.items]);

  const isClassic = prefs.diet === 'classic';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{swapRecipe ? 'Swap a meal' : 'Browse'}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {swapRecipe ? `Replace ${swapRecipe.title}` : 'All recipes'}
        </Text>
        {swapRecipe && (
          <Pressable onPress={endSwap} hitSlop={8} accessibilityRole="button">
            <Text style={styles.dietNoteLink}>Cancel swap</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.searchRow}>
        <Feather name="search" size={16} color={colors.inkSoft} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search recipes or ingredients"
          placeholderTextColor={colors.inkSoft}
          style={styles.searchInput}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Feather name="x-circle" size={16} color={colors.inkSoft} />
          </Pressable>
        )}
      </View>

      {!swapRecipe && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ gap: 8 }}
        >
          {chips.map((f) => {
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
      )}

      {!isClassic && (
        <View style={styles.dietNoteRow}>
          <Text style={styles.dietNote}>
            {showAllDiets ? 'Showing all diets' : `Showing ${DIETS[prefs.diet].label.toLowerCase()} recipes`}
          </Text>
          <Pressable onPress={() => setShowAllDiets((v) => !v)} hitSlop={8} accessibilityRole="button">
            <Text style={styles.dietNoteLink}>{showAllDiets ? `Only ${DIETS[prefs.diet].label.toLowerCase()}` : 'Show all diets'}</Text>
          </Pressable>
        </View>
      )}
      {(prefs.allergies.length > 0 || prefs.dislikes.length > 0) && (
        <Text style={styles.exclusionNote}>Recipes with your allergies or avoided ingredients are hidden.</Text>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 96, gap: 10 }}>
        {recipes.length === 0 && <Text style={styles.emptyText}>No recipes match your search.</Text>}
        {recipes.map((recipe) => {
          const inPlan = (inPlanCounts.get(recipe.id) || 0) > 0;
          return (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
              right={
                swapRecipe ? (
                  <Pressable
                    onPress={() => handleSwap(recipe.id, recipe.title)}
                    style={styles.addBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Swap in ${recipe.title}`}
                  >
                    <Feather name="repeat" size={16} color="#fff" />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handleToggle(recipe.id, recipe.title)}
                    style={[styles.addBtn, inPlan && styles.addBtnInPlan]}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={inPlan ? `Remove ${recipe.title} from plan` : `Add ${recipe.title} to plan`}
                  >
                    <Feather name={inPlan ? 'check' : 'plus'} size={18} color="#fff" />
                  </Pressable>
                )
              }
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14,
    marginHorizontal: 20, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: colors.ink },
  filterRow: { marginTop: 12, paddingHorizontal: 20, flexGrow: 0, flexShrink: 0 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterPillInactive: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  filterLabel: { fontWeight: '700', fontSize: 13 },
  dietNoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 12 },
  dietNote: { fontSize: 12.5, color: colors.inkSoft },
  dietNoteLink: { fontSize: 12.5, color: colors.forest, fontWeight: '700' },
  exclusionNote: { fontSize: 12, color: colors.inkSoft, paddingHorizontal: 20, marginTop: 6 },
  addBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.forest,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnInPlan: { backgroundColor: colors.sage },
  emptyText: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', marginTop: 40 },
});
