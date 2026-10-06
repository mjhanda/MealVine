import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { confirmAction } from '../components/dialogs';
import RecentlyCooked from '../components/RecentlyCooked';
import RecipeCard from '../components/RecipeCard';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { useHistoryStore } from '../store/historyStore';
import { cookAgain, markCooked, undoCooked } from '../store/mealActions';
import { usePlanStore } from '../store/planStore';
import { useEatingPrefs, usePreferencesStore } from '../store/preferencesStore';
import { useUndoStore } from '../store/undoStore';
import { colors, mealLabels, mealPlural, mealTypeOrder } from '../theme';
import { MealType, PlanItem } from '../types';
import { describeConflicts, recipeConflicts } from '../utils/diets';
import { recipeById } from '../utils/recipeCatalog';

type Nav = NativeStackNavigationProp<RootStackParamList & MainTabParamList>;

interface PlanGroup {
  mealType: MealType;
  items: PlanItem[];
}

function buildGroups(mealTypes: MealType[], items: PlanItem[]): PlanGroup[] {
  const order = [...mealTypes, ...mealTypeOrder.filter((t) => !mealTypes.includes(t))];
  return order
    .map((mealType) => ({
      mealType,
      items: items.filter((item) => recipeById(item.recipeId)?.mealType === mealType),
    }))
    .filter((group) => group.items.length > 0);
}

export default function PlanScreen() {
  const navigation = useNavigation<Nav>();
  const plan = usePlanStore((s) => s.plan);
  const removeItem = usePlanStore((s) => s.removeItem);
  const restoreItem = usePlanStore((s) => s.restoreItem);
  const clear = usePlanStore((s) => s.clear);
  const mealTypes = usePreferencesStore((s) => s.mealTypes);
  const prefs = useEatingPrefs();
  const cooked = useHistoryStore((s) => s.cooked);
  const showUndo = useUndoStore((s) => s.show);

  const groups = useMemo(() => buildGroups(mealTypes, plan.items), [mealTypes, plan.items]);
  const total = plan.items.length;

  const handleClear = () => {
    if (total === 0) return;
    confirmAction(
      'Clear your plan?',
      `Removes all ${total} meal${total === 1 ? '' : 's'} and their ingredients from the grocery list. Items you added yourself stay.`,
      'Clear',
      clear
    );
  };

  const handleCooked = (item: PlanItem, title: string) => {
    const removed = markCooked(item.id);
    if (removed) showUndo(`${title} marked as cooked`, () => undoCooked(removed));
  };

  const handleRemove = (item: PlanItem, title: string) => {
    removeItem(item.id);
    showUndo(`${title} removed from your plan`, () => restoreItem(item));
  };

  const openRecipe = (recipeId: string, planItemId?: string) =>
    navigation.navigate('RecipeDetail', { recipeId, planItemId });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Meal planner</Text>
          <Text style={styles.title}>Your plan</Text>
          {total > 0 && <Text style={styles.subtitle}>{total} meal{total === 1 ? '' : 's'} to cook</Text>}
        </View>
        <Pressable
          onPress={handleClear}
          disabled={total === 0}
          style={[styles.iconBtn, total === 0 && styles.iconBtnDisabled]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear plan"
        >
          <Feather name="trash-2" size={16} color={total === 0 ? colors.line : colors.forest} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {total === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{cooked.length > 0 ? 'All cooked' : 'No meals yet'}</Text>
            <Text style={styles.emptyText}>
              Search recipes in the Browse tab and tap + to build your plan. Your grocery list updates
              automatically.
            </Text>
            <Pressable onPress={() => navigation.navigate('Browse')} style={styles.emptyBtn} accessibilityRole="button">
              <Text style={styles.emptyBtnLabel}>Browse recipes</Text>
            </Pressable>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.mealType}>
              <Text style={styles.mealLabel}>{mealPlural[group.mealType]}</Text>
              <View style={styles.cardList}>
                {group.items.map((item) => {
                  const recipe = recipeById(item.recipeId);
                  if (!recipe) return null;
                  const conflicts = describeConflicts(recipeConflicts(recipe, prefs), prefs);
                  return (
                    <RecipeCard
                      key={item.id}
                      recipe={recipe}
                      servings={item.servings}
                      warning={conflicts.length ? conflicts.join(' · ') : undefined}
                      onPress={() => openRecipe(recipe.id, item.id)}
                      right={
                        <View style={styles.cardActions}>
                          <Pressable
                            onPress={() => navigation.navigate('Browse', { swapItemId: item.id })}
                            style={styles.removeBtn}
                            hitSlop={4}
                            accessibilityRole="button"
                            accessibilityLabel={`Swap ${recipe.title} for another recipe`}
                          >
                            <Feather name="repeat" size={16} color={colors.inkSoft} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleCooked(item, recipe.title)}
                            style={styles.cookedBtn}
                            hitSlop={6}
                            accessibilityRole="button"
                            accessibilityLabel={`Mark ${recipe.title} as cooked`}
                          >
                            <Feather name="check" size={16} color={colors.forest} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleRemove(item, recipe.title)}
                            style={styles.removeBtn}
                            hitSlop={6}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${recipe.title} from plan`}
                          >
                            <Feather name="x" size={18} color={colors.inkSoft} />
                          </Pressable>
                        </View>
                      }
                    />
                  );
                })}
              </View>
            </View>
          ))
        )}

        {total > 0 && (
          <Text style={styles.footerText}>
            Tap ✓ when you&apos;ve cooked a meal, or ⟳ to swap it. Tip: use the {mealLabels.snack.toLowerCase()}s in Browse to
            round out your day.
          </Text>
        )}

        <RecentlyCooked
          entries={cooked}
          onOpen={(recipeId) => openRecipe(recipeId)}
          onCookAgain={(entry) => {
            const addedId = cookAgain(entry.recipeId, entry.servings);
            const title = recipeById(entry.recipeId)?.title ?? 'Meal';
            showUndo(`${title} added back to your plan`, () => removeItem(addedId));
          }}
        />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest },
  subtitle: { fontSize: 12.5, color: colors.inkSoft, marginTop: 4 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDisabled: { borderColor: colors.line, opacity: 0.6 },
  scroll: { padding: 20, gap: 22, paddingBottom: 96, flexGrow: 1 },
  emptyState: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.ink },
  emptyText: { fontSize: 14, color: colors.inkSoft, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 10, backgroundColor: colors.forest, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  emptyBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  mealLabel: {
    fontSize: 11.5, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 8,
  },
  cardList: { gap: 10 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cookedBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.sageLight,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  footerText: { fontSize: 12.5, color: colors.inkSoft, textAlign: 'center' },
});
