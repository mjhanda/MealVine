import { Feather, Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdSlot from '../ads/AdSlot';
import ProteinTag from '../components/ProteinTag';
import RatingButtons from '../components/RatingButtons';
import { RootStackParamList } from '../navigation/types';
import { useFavoritesStore } from '../store/favoritesStore';
import { useHistoryStore } from '../store/historyStore';
import { useRecipeNotesStore } from '../store/recipeNotesStore';
import { MAX_SERVINGS, MIN_SERVINGS, usePlanStore } from '../store/planStore';
import { useEatingPrefs, usePreferencesStore } from '../store/preferencesStore';
import { colors } from '../theme';
import { describeConflicts, DIETS, dietsFor, isExcluded, recipeConflicts } from '../utils/diets';
import { ingredientDisplayName, recipeById } from '../utils/recipeCatalog';
import { formatQuantity, scaleAmount } from '../utils/units';


type Props = NativeStackScreenProps<RootStackParamList, 'RecipeDetail'>;

export default function RecipeDetailScreen({ route, navigation }: Props) {
  const recipe = recipeById(route.params.recipeId);
  const householdSize = usePreferencesStore((s) => s.householdSize);
  const prefs = useEatingPrefs();
  const note = useRecipeNotesStore((s) => s.notes[route.params.recipeId] ?? '');
  const setNote = useRecipeNotesStore((s) => s.setNote);
  const timesCooked = useHistoryStore((s) => s.cooked.filter((e) => e.recipeId === route.params.recipeId).length);
  const [draftServings, setDraftServings] = useState(householdSize);
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const plan = usePlanStore((s) => s.plan);
  const addItem = usePlanStore((s) => s.addItem);
  const updateServings = usePlanStore((s) => s.updateServings);
  // Opened from the plan → the stepper edits that entry (and so the grocery list) directly.
  const planItem = plan.items.find((item) => item.id === route.params.planItemId);
  const servings = planItem ? planItem.servings : draftServings;
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
  const conflicts = recipeConflicts(recipe, prefs);
  const conflictText = describeConflicts(conflicts, prefs);
  const fits = dietsFor(recipe).map((d) => DIETS[d].label);
  const inPlanCount = plan.items.filter((item) => item.recipeId === recipe.id).length;

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
          <View style={styles.timeRow}>
            <Feather name="clock" size={13} color={colors.inkSoft} />
            <Text style={styles.timeText}>{recipe.prep + recipe.cook} min</Text>
          </View>
        </View>

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
            <Pressable onPress={() => addItem(recipe.id, servings)} style={styles.addBtn} accessibilityRole="button">
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
          onPress={() => navigation.navigate('Cook', { recipeId: recipe.id, planItemId: planItem?.id })}
          style={styles.cookBtn}
          accessibilityRole="button"
        >
          <Feather name="play" size={16} color={colors.forest} />
          <Text style={styles.cookBtnLabel}>Start cooking</Text>
        </Pressable>

        <Text style={styles.sectionHeader}>Ingredients</Text>
        <View style={{ gap: 8 }}>
          {recipe.ingredients.map((ing, i) => {
            const amount = scaleAmount(ing.amount, recipe.servings, servings);
            return (
              <View key={i} style={styles.ingredientRow}>
                <Text style={styles.ingredientName}>{ingredientDisplayName(ing, amount)}</Text>
                <Text style={styles.ingredientAmount}>{formatQuantity(amount, ing.unit)}</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionHeader}>Steps</Text>
        <View style={{ gap: 14 }}>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
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
  ingredientName: { color: colors.ink, fontSize: 14 },
  ingredientAmount: { color: colors.inkSoft, fontWeight: '600', fontSize: 14 },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.forest,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  adWrap: { marginTop: 24 },
  noteInput: {
    minHeight: 72, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.card, fontSize: 14, color: colors.ink, textAlignVertical: 'top',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  ratingLabel: { fontSize: 13.5, color: colors.inkSoft, fontWeight: '600' },
  stepText: { flex: 1, fontSize: 14, color: colors.ink, lineHeight: 21, paddingTop: 2 },
});
