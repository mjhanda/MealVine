import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notify } from '../components/dialogs';
import { RootStackParamList } from '../navigation/types';
import { canFetchPages, fetchRecipePage, FetchPageError } from '../services/recipeFetch';
import { usePreferencesStore } from '../store/preferencesStore';
import { colors, radius, spacing } from '../theme';
import { draftFromImport, hostName, normalizeRecipeUrl, parseRecipeHtml, parseRecipeText } from '../utils/recipeImport';

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeImport'>;

const NO_RECIPE = "We couldn't find recipe details on that page. Copy the recipe from the page and paste it below instead.";

// Import a recipe from a link (native only) or pasted text, then finish it in the editor.
export default function RecipeImportScreen({ navigation }: Props) {
  const householdSize = usePreferencesStore((s) => s.householdSize);
  const [link, setLink] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const native = canFetchPages();

  const readLink = async () => {
    const url = normalizeRecipeUrl(link);
    if (!url) {
      notify('Check the link', 'Paste the full address of a recipe page, like https://example.com/recipe.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = parseRecipeHtml(await fetchRecipePage(url), url);
      if (!result.ok) {
        setMessage(NO_RECIPE);
        return;
      }
      navigation.replace('RecipeEditor', { draft: draftFromImport(result.recipe, householdSize) });
    } catch (e) {
      setMessage(e instanceof FetchPageError ? e.message : NO_RECIPE);
    } finally {
      setBusy(false);
    }
  };

  const useText = () => {
    const parsed = parseRecipeText(text);
    if (parsed.ingredientLines.length === 0 && parsed.steps.length === 0) {
      notify('Nothing to import yet', 'Paste the recipe: its name, ingredients (one per line), and steps.');
      return;
    }
    // A link typed above still earns the site its credit.
    const url = normalizeRecipeUrl(link) ?? '';
    const withCredit = url ? { ...parsed, url, siteName: hostName(url) } : parsed;
    navigation.replace('RecipeEditor', { draft: draftFromImport(withCredit, householdSize) });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn} accessibilityRole="button">
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Import a recipe</Text>
        <View style={styles.headerBtn} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Bring in a recipe you want to cook. It’s saved only on this device, for your own use, with a link back to where it came from.
          </Text>

          <Text style={styles.section}>Recipe link</Text>
          <TextInput
            value={link}
            onChangeText={setLink}
            placeholder="https://"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            accessibilityLabel="Recipe link"
          />
          {native ? (
            <Pressable onPress={readLink} disabled={busy} style={[styles.primary, busy && styles.disabled]} accessibilityRole="button">
              {busy ? <ActivityIndicator color={colors.cream} /> : <Feather name="download" size={16} color={colors.cream} />}
              <Text style={styles.primaryLabel}>{busy ? 'Reading the page…' : 'Read recipe from link'}</Text>
            </Pressable>
          ) : (
            <Text style={styles.hint}>
              In a browser, Dishcart can’t read other sites. Paste the recipe text below; the link is kept as credit.
            </Text>
          )}
          {native && <Text style={styles.hint}>Dishcart loads only that page. Nothing about you is sent.</Text>}
          {message && (
            <View style={styles.notice} accessibilityRole="alert">
              <Feather name="info" size={15} color={colors.ink} />
              <Text style={styles.noticeText}>{message}</Text>
            </View>
          )}

          <Text style={styles.section}>Or paste the recipe</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={'Recipe name\nIngredients\n2 cups flour\n…\nInstructions\nMix…'}
            placeholderTextColor={colors.inkSoft}
            multiline
            style={[styles.input, styles.textArea]}
            accessibilityLabel="Recipe text"
          />
          <Pressable onPress={useText} style={styles.secondary} accessibilityRole="button">
            <Feather name="clipboard" size={16} color={colors.forest} />
            <Text style={styles.secondaryLabel}>Use this text</Text>
          </Pressable>
          <Text style={styles.hint}>You’ll check everything in the editor before it’s saved.</Text>
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
  scroll: { padding: spacing.xl, paddingBottom: 60 },
  intro: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  section: {
    fontWeight: '800', fontSize: 13, color: colors.forest, marginTop: spacing.xxl, marginBottom: spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 15, color: colors.ink, backgroundColor: colors.card,
  },
  textArea: { minHeight: 180, textAlignVertical: 'top' },
  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 48, marginTop: spacing.md,
    borderRadius: radius.md, backgroundColor: colors.forest,
  },
  disabled: { opacity: 0.7 },
  primaryLabel: { color: colors.cream, fontWeight: '700', fontSize: 15 },
  secondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 48, marginTop: spacing.md,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.forest,
  },
  secondaryLabel: { color: colors.forest, fontWeight: '700', fontSize: 15 },
  hint: { fontSize: 12.5, color: colors.inkSoft, lineHeight: 18, marginTop: spacing.sm },
  notice: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginTop: spacing.md, padding: spacing.md,
    borderRadius: radius.md, backgroundColor: colors.goldLight,
  },
  noticeText: { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 18 },
});
