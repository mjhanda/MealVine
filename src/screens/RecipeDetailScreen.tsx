import { Feather, Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdSlot from '../ads/AdSlot';
import ProteinTag from '../components/ProteinTag';
import NutritionPanel from '../components/NutritionPanel';
import RatingButtons from '../components/RatingButtons';
import SauceChoice from '../components/SauceChoice';
import { isUserRecipeId } from '../data/userRecipes';
import { RootStackParamList } from '../navigation/types';
import { useUserRecipes } from '../store/customRecipesStore';
import { useFavoritesStore } from '../store/favoritesStore';
import { useHistoryStore } from '../store/historyStore';
import { deleteUserRecipe } from '../store/mealActions';
import { useUndoStore } from '../store/undoStore';
import { useRecipeNotesStore } from '../store/recipeNotesStore';
import { MAX_SERVINGS, MIN_SERVINGS, usePlanStore } from '../store/planStore';
import { useEatingPrefs, usePreferencesStore } from '../store/preferencesStore';
import { colors } from '../theme';
import { isCustomIngredient, NOT_CHECKED_NOTE } from '../utils/customIngredients';
import { describeConflicts, DIETS, dietsFor, isExcluded, recipeConflicts } from '../utils/diets';
import { defaultServings, ingredientDisplayName, recipeById, totalMinutes } from '../utils/recipeCatalog';
import { recipeAsCooked, sauceOptions, saucesToMake } from '../utils/homemade';
import { caloriesPerServing } from '../utils/nutrition';
import { sourceCredit } from '../utils/recipeSource';
import { formatQuantity, scaleAmount } from '../utils/units';


type Props = NativeStackScreenProps<RootStackParamList, 'RecipeDetail'>;

export default function RecipeDetailScreen({ route, navigation }: Props) {
  useUserRecipes(); // re-render after editing your own recipe
  const recipe = recipeById(route.params.recipeId);
  const showUndo = useUndoStore((s) => s.show);
  const householdSize = usePreferencesStore((s) => s.householdSize);
  const prefs = useEatingPrefs();
  const note = useRecipeNotesStore((s) => s.notes[route.params.recipeId] ?? '');
  const setNote = useRecipeNotesStore((s) => s.setNote);
  const timesCooked = useHistoryStore((s) => s.cooked.filter((e) => e.recipeId === route.params.recipeId).length);
  const [draftServings, setDraftServings] = useState(() => (recipe ? defaultServings(recipe, householdSize) : householdSize));
  const [tab, setTab] = useState<'recipe' | 'nutrition'>('recipe');
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const plan = usePlanStore((s) => s.plan);
  const addItem = usePlanStore((s) => s.addItem);
  const updateServings = usePlanStore((s) => s.updateServings);
  const setStoreBought = usePlanStore((s) => s.setStoreBought);
  const [draftStoreBought, setDraftStoreBought] = useState<string[]>([]);
  // Opened from the plan → the stepper edits that entry (and so the grocery list) directly.
  const planItem = plan.items.find((item) => item.id === route.params.planItemId);
  const servings = planItem ? planItem.servings : draftServings;
  // Sauces to buy rather than make: the plan entry's choice, or a draft carried into "Add to plan".
  const storeBought = planItem ? (planItem.storeBought ?? []) : draftStoreBought;
  const chooseBuy = (ingredientId: string, buy: boolean) => {
    if (planItem) {
      setStoreBought(planItem.id, ingredientId, buy);
      return;
    }
    setDraftStoreBought((list) => (buy ? [...list.filter((x) => x !== ingredientId), ingredientId] : list.filter((x) => x !== ingredientId)));
  };
  const changeServings = (delta: number) => {
    if (planItem) {
      updateServings(planItem.id, planItem.servings + delta);
      return;
    }
    setDraftServings((s) => Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, s + delta)));
  };

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Recipe not found.</Text>
      </SafeAreaView>
    );
  }

  const isFav = favorites.includes(recipe.id);
  const isMine = isUserRecipeId(recipe.id);
  // No confirmation: the undo bar brings the recipe (and its plan entries) back.
  const handleDelete = () => {
    const { title, id } = recipe;
    navigation.goBack();
    const undo = deleteUserRecipe(id);
    if (undo) showUndo(`Deleted ${title}`, undo);
  };
  const conflicts = recipeConflicts(recipe, prefs);
  const conflictText = describeConflicts(conflicts, prefs);
  const fits = dietsFor(recipe).map((d) => DIETS[d].label);
  const inPlanCount = plan.items.filter((item) => item.recipeId === recipe.id).length;
  const sauces = new Map(sauceOptions(recipe).map((o) => [o.ingredient.id, o]));
  const batches = new Map(saucesToMake(recipe, servings, storeBought).map((s) => [s.ingredient.id, s.batches]));
  // From-scratch sauces' steps come first, as in cooking mode.
  const steps = recipeAsCooked(recipe, servings, storeBought).steps;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="chevron-left" size={20} color={colors.forest} />
        </Pressable>
        <Pressable
          onPress={() => toggleFavorite(recipe.id)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityState={{ selected: isFav }}
          accessibilityLabel={isFav ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={colors.rust} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.emoji}>{recipe.emoji}</Text>
        <Text style={styles.title}>{recipe.title}</Text>
        <View style={styles.metaRow}>
          <ProteinTag protein={recipe.protein} />
          {totalMinutes(recipe) > 0 && (
            <View style={styles.timeRow}>
              <Feather name="clock" size={13} color={colors.inkSoft} />
              <Text style={styles.timeText}>{totalMinutes(recipe)} min</Text>
            </View>
          )}
        </View>

        {isMine && (
          <View style={styles.mineRow}>
            <Text style={styles.mineLabel}>Your recipe</Text>
            <Pressable
              onPress={() => navigation.navigate('RecipeEditor', { recipeId: recipe.id })}
              style={styles.mineBtn}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${recipe.title}`}
            >
              <Feather name="edit-2" size={14} color={colors.forest} />
              <Text style={styles.mineBtnLabel}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={styles.mineBtn}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${recipe.title}`}
            >
              <Feather name="trash-2" size={14} color={colors.rustText} />
              <Text style={[styles.mineBtnLabel, { color: colors.rustText }]}>Delete</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.fitsText}>Fits: {fits.join(' · ')}</Text>

        {conflictText.length > 0 && (
          <View style={[styles.banner, isExcluded(conflicts) && styles.bannerDanger]} accessibilityRole="alert">
            <Feather name="alert-triangle" size={15} color={isExcluded(conflicts) ? colors.rust : colors.inkSoft} />
            <Text style={styles.bannerText}>
              {conflictText.join(' · ')}
              {conflicts.allergens.length > 0 ? ' — check with your allergies before cooking.' : ''}
            </Text>
          </View>
        )}

        <View style={styles.servingsRow}>
          <View style={styles.servingsLabelRow}>
            <Feather name="users" size={15} color={colors.ink} />
            <Text style={styles.servingsLabel}>Servings</Text>
          </View>
          <View style={styles.servingsControls}>
            <Pressable
              onPress={() => changeServings(-1)}
              hitSlop={6}
              disabled={servings <= MIN_SERVINGS}
              accessibilityRole="button"
              accessibilityLabel="Fewer servings"
              style={styles.circleBtnSm}
            >
              <Feather name="minus" size={14} color={colors.forest} />
            </Pressable>
            <Text style={styles.servingsValue}>{servings}</Text>
            <Pressable
              onPress={() => changeServings(1)}
              hitSlop={6}
              disabled={servings >= MAX_SERVINGS}
              accessibilityRole="button"
              accessibilityLabel="More servings"
              style={styles.circleBtnSm}
            >
              <Feather name="plus" size={14} color={colors.forest} />
            </Pressable>
          </View>
        </View>

        {planItem ? (
          <Text style={styles.inPlanNote}>In your plan — changing servings updates your grocery list.</Text>
        ) : (
          <>
            <Pressable onPress={() => addItem(recipe.id, servings, draftStoreBought)} style={styles.addBtn} accessibilityRole="button">
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.addBtnLabel}>
                {inPlanCount > 0 ? 'Add another to plan' : 'Add to plan'}
              </Text>
            </Pressable>
            {inPlanCount > 0 && (
              <Text style={styles.inPlanNote}>
                Already in your plan {inPlanCount} time{inPlanCount === 1 ? '' : 's'}
              </Text>
            )}
          </>
        )}

        <Pressable
          onPress={() => navigation.navigate('Cook', { recipeId: recipe.id, planItemId: planItem?.id, storeBought })}
          style={styles.cookBtn}
          accessibilityRole="button"
        >
          <Feather name="play" size={16} color={colors.forest} />
          <Text style={styles.cookBtnLabel}>Start cooking</Text>
        </Pressable>

        <View style={styles.tabs} accessibilityRole="tablist">
          {(['recipe', 'nutrition'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t === 'recipe' ? 'Recipe' : `Nutrition · ${Math.round(caloriesPerServing(recipe) / 10) * 10} kcal`}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'recipe' ? (
          <>
            <Text style={styles.sectionHeader}>Ingredients</Text>
            <View style={{ gap: 8 }}>
              {recipe.ingredients.map((ing, i) => {
                const amount = scaleAmount(ing.amount, recipe.servings, servings);
                const sauce = sauces.get(ing.id);
                return (
                  <View key={i}>
                    <View style={[styles.ingredientRow, sauce && styles.ingredientRowSauce]}>
                      <View style={styles.ingredientNameWrap}>
                        <Text style={styles.ingredientName}>{ingredientDisplayName(ing, amount)}</Text>
                        {isCustomIngredient(ing) && <Text style={styles.uncheckedNote}>{NOT_CHECKED_NOTE}</Text>}
                      </View>
                      <Text style={styles.ingredientAmount}>{formatQuantity(amount, ing.unit)}</Text>
                    </View>
                    {sauce && (
                      <SauceChoice
                        option={sauce}
                        buy={storeBought.includes(ing.id)}
                        batches={batches.get(ing.id) ?? 1}
                        onChange={(buy) => chooseBuy(ing.id, buy)}
                        onOpenRecipe={() => navigation.push('RecipeDetail', { recipeId: sauce.sauce.id })}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionHeader}>Steps</Text>
            <View style={{ gap: 14 }}>
              {steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sourceBox}>
              <Text style={styles.sourceText}>{sourceCredit(recipe)}</Text>
              {recipe.source && (
                <>
                  <Text style={styles.sourceLicense}>{recipe.source.license}</Text>
                  <Pressable
                    onPress={() => Linking.openURL(recipe.source!.url)}
                    hitSlop={10}
                    accessibilityRole="link"
                    accessibilityLabel="Open the original recipe"
                  >
                    <Text style={styles.sourceLink}>View original</Text>
                  </Pressable>
                </>
              )}
            </View>

            <View style={styles.adWrap}>
              <AdSlot placement="recipe-detail" />
            </View>

            <Text style={styles.sectionHeader}>Your notes</Text>
            <TextInput
              value={note}
              onChangeText={(text) => setNote(recipe.id, text)}
              placeholder="Tweaks for next time — e.g. half the chili, add lime"
              placeholderTextColor={colors.inkSoft}
              multiline
              style={styles.noteInput}
              accessibilityLabel="Your notes for this recipe"
            />
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>
                {timesCooked ? `Cooked ${timesCooked}× · how was it?` : 'How was it?'}
              </Text>
              <RatingButtons recipeId={recipe.id} />
            </View>
          </>
        ) : (
          <NutritionPanel recipe={recipe} servings={servings} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  iconBtn: { padding: 4 },
  emptyText: { padding: 20, color: colors.inkSoft },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '600', color: colors.forest, textAlign: 'center', lineHeight: 28 },
  metaRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10, alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: colors.inkSoft },
  fitsText: { fontSize: 12, color: colors.inkSoft, textAlign: 'center', marginTop: 10 },
  banner: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 16, padding: 12, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
  },
  bannerDanger: { backgroundColor: colors.rustLight, borderColor: colors.rust },
  bannerText: { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 18 },
  tabs: {
    flexDirection: 'row', marginTop: 20, borderRadius: 12, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.card, padding: 3,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  tabActive: { backgroundColor: colors.forest },
  tabLabel: { fontSize: 13.5, fontWeight: '700', color: colors.inkSoft },
  tabLabelActive: { color: '#fff' },
  servingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14,
  },
  servingsLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  servingsLabel: { fontWeight: '700', fontSize: 13.5, color: colors.ink },
  servingsControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  circleBtnSm: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.sageLight,
    alignItems: 'center', justifyContent: 'center',
  },
  servingsValue: { fontWeight: '600', fontSize: 17, minWidth: 16, textAlign: 'center', color: colors.ink },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20,
    backgroundColor: colors.forest, borderRadius: 14, paddingVertical: 14,
  },
  addBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  inPlanNote: { fontSize: 12.5, color: colors.sageText, textAlign: 'center', marginTop: 8, fontWeight: '600' },
  cookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12,
    borderRadius: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: colors.forest,
  },
  cookBtnLabel: { color: colors.forest, fontWeight: '700', fontSize: 15 },
  sectionHeader: {
    fontWeight: '800', fontSize: 13, color: colors.forest, marginTop: 24, marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  ingredientRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  ingredientRowSauce: { borderBottomWidth: 0 },
  ingredientNameWrap: { flex: 1, marginRight: 12 },
  ingredientName: { color: colors.ink, fontSize: 14 },
  uncheckedNote: { fontSize: 11.5, color: colors.rustText, marginTop: 2 },
  mineRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 },
  mineLabel: { fontSize: 12.5, fontWeight: '700', color: colors.goldText, marginRight: 4 },
  mineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 10 },
  mineBtnLabel: { fontSize: 13, fontWeight: '700', color: colors.forest },
  ingredientAmount: { color: colors.inkSoft, fontWeight: '600', fontSize: 14 },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.forest,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  adWrap: { marginTop: 24 },
  sourceBox: { marginTop: 20, gap: 4 },
  sourceText: { fontSize: 12.5, color: colors.inkSoft, lineHeight: 18 },
  sourceLicense: { fontSize: 11.5, color: colors.inkSoft, lineHeight: 16 },
  sourceLink: { fontSize: 12.5, fontWeight: '700', color: colors.forest },
  noteInput: {
    minHeight: 72, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.card, fontSize: 14, color: colors.ink, textAlignVertical: 'top',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  ratingLabel: { fontSize: 13.5, color: colors.inkSoft, fontWeight: '600' },
  stepText: { flex: 1, fontSize: 14, color: colors.ink, lineHeight: 21, paddingTop: 2 },
});
