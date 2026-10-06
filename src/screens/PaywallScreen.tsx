import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notify } from '../components/dialogs';
import { PRIVACY_URL, TERMS_URL, TRIAL_DAYS } from '../config/purchases';
import { getPackages, purchase, restore } from '../services/purchases';
import { colors, radius, spacing } from '../theme';
import { annualSavings, periodLabel, trialLabel } from '../utils/subscription';

const BENEFITS = [
  'Recipes filtered to your diet, allergies, and dislikes',
  'One grocery list, sorted by aisle, built from your meals',
  'Cooking mode with step timers',
  'No ads. Works offline. Your data stays on your phone.',
];

const store = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

function describe(pkg: PurchasesPackage) {
  const period = periodLabel(pkg.product.subscriptionPeriod);
  return {
    period,
    price: `${pkg.product.priceString}/${period}`,
    trial: trialLabel(pkg.product.introPrice),
  };
}

export default function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Only sets state from async callbacks, so it's safe to run from an effect.
  const fetchPackages = useCallback(() => {
    getPackages()
      .then((pkgs) => {
        setPackages(pkgs);
        // Default to yearly when offered (best value), else the first package.
        setSelected((pkgs.find((p) => p.packageType === 'ANNUAL') ?? pkgs[0])?.identifier ?? null);
        if (pkgs.length === 0) setError('No subscription options are available right now.');
      })
      .catch((e) => {
        console.warn('[paywall] offerings failed', e);
        setError("Couldn't reach the store. Check your connection and try again.");
      });
  }, []);

  useEffect(fetchPackages, [fetchPackages]);

  const retry = () => {
    setError(null);
    setPackages(null);
    fetchPackages();
  };

  const chosen = packages?.find((p) => p.identifier === selected) ?? null;
  const monthly = packages?.find((p) => p.packageType === 'MONTHLY');
  const chosenInfo = chosen ? describe(chosen) : null;

  const handleBuy = async () => {
    if (!chosen) return;
    setBusy(true);
    const result = await purchase(chosen);
    setBusy(false);
    if (!result.ok && !result.cancelled) notify("Purchase didn't go through", result.message);
  };

  const handleRestore = async () => {
    setBusy(true);
    const result = await restore();
    setBusy(false);
    if (!result.ok) notify("Couldn't restore", result.message);
    else if (!result.found) notify('Nothing to restore', `No active MealVine subscription was found for this ${store} account.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>MealVine</Text>
        <Text style={styles.title}>Try everything free for {TRIAL_DAYS} days</Text>
        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Feather name="check" size={16} color={colors.forest} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        {packages === null && !error && <ActivityIndicator color={colors.forest} style={{ marginTop: spacing.xl }} />}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={retry} style={styles.retry} accessibilityRole="button">
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.options} accessibilityRole="radiogroup">
          {packages?.map((pkg) => {
            const info = describe(pkg);
            const active = pkg.identifier === selected;
            const savings =
              pkg.packageType === 'ANNUAL' && monthly ? annualSavings(monthly.product.price, pkg.product.price) : null;
            return (
              <Pressable
                key={pkg.identifier}
                onPress={() => setSelected(pkg.identifier)}
                style={[styles.option, active && styles.optionActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{info.period === 'year' ? 'Yearly' : info.period === 'month' ? 'Monthly' : pkg.product.title}</Text>
                  <Text style={styles.optionPrice}>{info.price}</Text>
                  {info.trial && <Text style={styles.optionTrial}>{info.trial}</Text>}
                </View>
                {savings && <Text style={styles.savings}>{savings}</Text>}
                <Feather name={active ? 'check-circle' : 'circle'} size={20} color={active ? colors.forest : colors.line} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleBuy}
          disabled={!chosen || busy}
          style={[styles.cta, (!chosen || busy) && styles.ctaDisabled]}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaLabel}>{chosenInfo?.trial ? 'Start free trial' : 'Subscribe'}</Text>
          )}
        </Pressable>
        {chosenInfo && (
          <Text style={styles.fine}>
            {chosenInfo.trial
              ? `Free for ${TRIAL_DAYS} days, then ${chosenInfo.price}. `
              : `${chosenInfo.price}. `}
            Renews automatically until canceled. Cancel anytime in your {store} subscriptions
            {chosenInfo.trial ? ' at least 24 hours before the trial ends to avoid being charged' : ''}.
          </Text>
        )}
        <View style={styles.links}>
          <Pressable onPress={handleRestore} disabled={busy} hitSlop={10} accessibilityRole="button">
            <Text style={styles.link}>Restore purchases</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={10} accessibilityRole="link">
            <Text style={styles.link}>Terms</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={10} accessibilityRole="link">
            <Text style={styles.link}>Privacy</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  eyebrow: { fontSize: 15, fontWeight: '700', color: colors.goldText },
  title: { fontSize: 28, fontWeight: '700', color: colors.forest, lineHeight: 34 },
  benefits: { gap: spacing.md, marginTop: spacing.sm },
  benefitRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  benefitText: { flex: 1, fontSize: 15, color: colors.ink, lineHeight: 21 },
  options: { gap: spacing.md, marginTop: spacing.md },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg,
    borderRadius: radius.md, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.card,
  },
  optionActive: { borderColor: colors.forest, backgroundColor: colors.sageLight },
  optionText: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  optionPrice: { fontSize: 14, color: colors.inkSoft },
  optionTrial: { fontSize: 13, fontWeight: '700', color: colors.sageText },
  savings: {
    fontSize: 12, fontWeight: '800', color: colors.ink, backgroundColor: colors.goldLight,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, overflow: 'hidden',
  },
  errorBox: { gap: spacing.sm, alignItems: 'center', marginTop: spacing.lg },
  errorText: { fontSize: 14, color: colors.rustText, textAlign: 'center' },
  retry: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.sageLight },
  retryLabel: { fontWeight: '700', color: colors.forest },
  footer: { padding: spacing.xl, paddingTop: spacing.md, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.line },
  cta: { backgroundColor: colors.forest, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  ctaDisabled: { backgroundColor: colors.inkSoft },
  ctaLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
  fine: { fontSize: 11.5, color: colors.inkSoft, textAlign: 'center', lineHeight: 16 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
  link: { fontSize: 13, fontWeight: '700', color: colors.forest },
});
