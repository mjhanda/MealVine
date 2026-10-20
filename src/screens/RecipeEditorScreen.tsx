import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { confirmAction, notify } from '../components/dialogs';
import ChipRow from '../components/editor/ChipRow';
import IngredientLine from '../components/editor/IngredientLine';
import IngredientPicker, { IngredientPick } from '../components/editor/IngredientPicker';
import { RootStackParamList } from '../navigation/types';
import { useCustomRecipesStore } from '../store/customRecipesStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { colors, mealLabels, mealTypeOrder, proteinMeta, radius, spacing } from '../theme';
import { Protein } from '../types';
import {
  draftFromRecipe,
  emptyDraft,
  IngredientDraft,
  MAX_RECIPE_SERVINGS,
  newDraftKey,
  RecipeDraft,
  recipeFromDraft,
  validateDraft,
  withIngredient,
} from '../utils/customRecipes';
import { recipeById } from '../utils/recipeCatalog';
import { sourceCredit } from '../utils/recipeSource';

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeEditor'>;

const MEAL_OPTIONS = mealTypeOrder.map((m) => ({ value: m, label: mealLabels[m] }));
const PROTEIN_OPTIONS: { value: Protein | null; label: string }[] = [
  { value: null, label: 'Automatic' },
  ...(Object.keys(proteinMeta) as Protein[]).map((p) => ({ value: p, label: proteinMeta[p].label })),
];

// Where the ingredient picker is open: on an existing line (to change it) or for a new line.
type PickerTarget = { key: string } | 'new' | null;

function useInitialDraft(params: Props['route']['params'], householdSize: number): RecipeDraft {
  return useMemo(() => {
    if (params?.draft) return params.draft;
    const existing = params?.recipeId ? recipeById(params.recipeId) : undefined;
    return existing ? draftFromRecipe(existing) : emptyDraft(householdSize);
  }, [params, householdSize]);
}

export default function RecipeEditorScreen({ route, navigation }: Props) {
  const householdSize = usePreferencesStore((s) => s.householdSize);
  const saveRecipe = useCustomRecipesStore((s) => s.saveRecipe);
  const initial = useInitialDraft(route.params, householdSize);
  const [draft, setDraft] = useState<RecipeDraft>(initial);
  const [picker, setPicker] = useState<PickerTarget>(null);
  const editing = !!draft.id;

  const update = (changes: Partial<RecipeDraft>) => setDraft((d) => ({ ...d, ...changes }));
  const updateLine = (line: IngredientDraft) =>
    setDraft((d) => ({ ...d, ingredients: d.ingredients.map((l) => (l.key === line.key ? line : l)) }));
  const removeLine = (key: string) => setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((l) => l.key !== key) }));

  const pick = (choice: IngredientPick) => {
    if (picker === 'new') {
      const blank: IngredientDraft = { key: newDraftKey(), id: '', amount: '1', unit: null, prep: '' };
      setDraft((d) => ({ ...d, ingredients: [...d.ingredients, withIngredient(blank, choice)] }));
    } else if (picker) {
      const line = draft.ingredients.find((l) => l.key === picker.key);
      if (line) updateLine(withIngredient(line, choice));
    }
    setPicker(null);
  };

  const setStep = (i: number, text: string) => setDraft((d) => ({ ...d, steps: d.steps.map((s, j) => (j === i ? text : s)) }));
  const removeStep = (i: number) => setDraft((d) => ({ ...d, steps: d.steps.length > 1 ? d.steps.filter((_, j) => j !== i) : [''] }));

  const handleSave = () => {
    const errors = validateDraft(draft);
    if (errors.length) {
      notify('Almost there', errors.join('\n'));
      return;
    }
    const recipe = recipeFromDraft(draft);
    saveRecipe(recipe);
    if (editing) navigation.goBack();
    else navigation.replace('RecipeDetail', { recipeId: recipe.id });
  };

  const handleCancel = () => {
    if (JSON.stringify(draft) === JSON.stringify(initial)) {
      navigation.goBack();
      return;
    }
    confirmAction('Discard changes?', "What you've entered here won't be saved.", 'Discard', () => navigation.goBack());
  };

  const pickerLine = picker && picker !== 'new' ? draft.ingredients.find((l) => l.key === picker.key) : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.headerBtn} accessibilityRole="button">
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{editing ? 'Edit recipe' : 'Your recipe'}</Text>
        <Pressable onPress={handleSave} style={styles.headerBtn} accessibilityRole="button">
          <Text style={styles.save}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.titleRow}>
            <TextInput
              value={draft.emoji}
              onChangeText={(emoji) => update({ emoji })}
              style={[styles.input, styles.emojiInput]}
              maxLength={8}
              accessibilityLabel="Emoji for this recipe"
            />
            <TextInput
              value={draft.title}
              onChangeText={(title) => update({ title })}
              placeholder="Recipe name"
              placeholderTextColor={colors.inkSoft}
              style={[styles.input, styles.flex]}
              accessibilityLabel="Recipe name"
            />
          </View>

          <Text style={styles.label}>Meal type</Text>
          <ChipRow label="Meal type" options={MEAL_OPTIONS} selected={draft.mealType} onSelect={(mealType) => update({ mealType })} />

          <View style={styles.numbersRow}>
            <View style={styles.numberField}>
              <Text style={styles.label}>Servings</Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => update({ servings: Math.max(1, draft.servings - 1) })}
                  style={styles.stepBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Fewer servings"
                >
                  <Feather name="minus" size={14} color={colors.forest} />
                </Pressable>
                <Text style={styles.stepValue}>{draft.servings}</Text>
                <Pressable
                  onPress={() => update({ servings: Math.min(MAX_RECIPE_SERVINGS, draft.servings + 1) })}
                  style={styles.stepBtn}
                  accessibilityRole="button"
                  accessibilityLabel="More servings"
                >
                  <Feather name="plus" size={14} color={colors.forest} />
                </Pressable>
              </View>
            </View>
            <View style={styles.numberField}>
              <Text style={styles.label}>Prep (min)</Text>
              <TextInput
                value={draft.prep}
                onChangeText={(prep) => update({ prep })}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.inkSoft}
                style={styles.input}
                accessibilityLabel="Prep time in minutes"
              />
            </View>
            <View style={styles.numberField}>
              <Text style={styles.label}>Cook (min)</Text>
              <TextInput
                value={draft.cook}
                onChangeText={(cook) => update({ cook })}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.inkSoft}
                style={styles.input}
                accessibilityLabel="Cook time in minutes"
              />
            </View>
          </View>

          <Text style={styles.label}>Main protein</Text>
          <ChipRow label="Main protein" options={PROTEIN_OPTIONS} selected={draft.protein} onSelect={(protein) => update({ protein })} />

          <Text style={styles.section}>Ingredients</Text>
          <Text style={styles.hint}>
            Amounts are for {draft.servings} serving{draft.servings === 1 ? '' : 's'}. Pick ingredients from the list so your
            grocery list, nutrition, and allergy checks work.
          </Text>
          <View style={styles.list}>
            {draft.ingredients.map((line) => (
              <View key={line.key}>
                <IngredientLine
                  line={line}
                  onChange={updateLine}
                  onChangeIngredient={() => setPicker({ key: line.key })}
                  onRemove={() => removeLine(line.key)}
                />
                {pickerLine?.key === line.key && (
                  <IngredientPicker initialQuery={line.custom ?? ''} onPick={pick} onCancel={() => setPicker(null)} />
                )}
              </View>
            ))}
          </View>
          {picker === 'new' ? (
            <IngredientPicker onPick={pick} onCancel={() => setPicker(null)} />
          ) : (
            <Pressable onPress={() => setPicker('new')} style={styles.addBtn} accessibilityRole="button">
              <Feather name="plus" size={16} color={colors.forest} />
              <Text style={styles.addLabel}>Add ingredient</Text>
            </Pressable>
          )}

          <Text style={styles.section}>Steps</Text>
          <View style={styles.list}>
            {draft.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{i + 1}</Text>
                </View>
                <TextInput
                  value={step}
                  onChangeText={(text) => setStep(i, text)}
                  placeholder={i === 0 ? 'e.g. Simmer the sauce 10 minutes' : 'Next step'}
                  placeholderTextColor={colors.inkSoft}
                  multiline
                  style={[styles.input, styles.stepInput]}
                  accessibilityLabel={`Step ${i + 1}`}
                />
                <Pressable onPress={() => removeStep(i)} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={`Remove step ${i + 1}`}>
                  <Feather name="x" size={16} color={colors.inkSoft} />
                </Pressable>
              </View>
            ))}
          </View>
          <Pressable onPress={() => update({ steps: [...draft.steps, ''] })} style={styles.addBtn} accessibilityRole="button">
            <Feather name="plus" size={16} color={colors.forest} />
            <Text style={styles.addLabel}>Add step</Text>
          </Pressable>
          <Text style={styles.hint}>Name ingredients and times in each step (“Simmer the rice 18 minutes”) and cooking mode will show them and offer a timer.</Text>

          {draft.source && <Text style={styles.credit}>{sourceCredit(recipeFromDraft(draft, 'u-preview'))}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.line,
  },
  headerBtn: { minHeight: 44, minWidth: 64, justifyContent: 'center', paddingHorizontal: spacing.sm },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.forest },
  cancel: { fontSize: 15, color: colors.inkSoft, fontWeight: '600' },
  save: { fontSize: 15, color: colors.forest, fontWeight: '800', textAlign: 'right' },
  scroll: { padding: spacing.xl, paddingBottom: 60 },
  titleRow: { flexDirection: 'row', gap: spacing.sm },
  emojiInput: { width: 56, textAlign: 'center', fontSize: 22 },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 15, color: colors.ink, backgroundColor: colors.card,
  },
  label: { fontSize: 12.5, fontWeight: '700', color: colors.inkSoft, marginTop: spacing.lg, marginBottom: 6 },
  numbersRow: { flexDirection: 'row', gap: spacing.md },
  numberField: { flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 16, fontWeight: '700', color: colors.ink },
  section: {
    fontWeight: '800', fontSize: 13, color: colors.forest, marginTop: spacing.xxl, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  hint: { fontSize: 12.5, color: colors.inkSoft, lineHeight: 18, marginBottom: spacing.sm },
  list: { gap: spacing.sm },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, marginTop: spacing.sm,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.forest, borderStyle: 'dashed',
  },
  addLabel: { fontSize: 14, fontWeight: '700', color: colors.forest },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  stepBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center', marginTop: 10,
  },
  stepBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepInput: { flex: 1, minHeight: 44, textAlignVertical: 'top' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  credit: { fontSize: 12.5, color: colors.inkSoft, marginTop: spacing.xl, lineHeight: 18 },
});
