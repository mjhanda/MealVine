import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notify } from '../components/dialogs';
import { PRIVACY_URL, TERMS_URL } from '../config/purchases';
import { RootStackParamList } from '../navigation/types';
import { getPackages, purchase, redeemCode, restore } from '../services/purchases';
import { useAdFree } from '../store/subscriptionStore';
import { colors, radius, spacing } from '../theme';
import { periodLabel } from '../utils/subscription';

type Props = NativeStackScreenProps<RootStackParamList, 'RemoveAds'>;

const store = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

export default function RemoveAdsScreen({ navigation }: Props) {
  const adFree = useAdFree();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Only sets state from async callbacks, so it's safe to run from an effect.
  const fetchPackage = useCallback(() => {
    getPackages()
      .then((pkgs) => {
        // One plan: monthly. Fall back to the first package if the offering is labelled differently.
        const monthly = pkgs.find((p) => p.packageType === 'MONTHLY') ?? pkgs[0] ?? null;
        setPkg(monthly);
        if (!monthly) setError('Ad-free isn’t available right now.');
      })
      .catch((e) => {
        console.warn('[remove-ads] offerings failed', e);
        setError("Couldn't reach the store. Check your connection and try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(fetchPackage, [fetchPackage]);

  // Close automatically once ads are gone (purchase, restore, or a redeemed code).
  useEffect(() => {
    if (adFree) navigation.goBack();
  }, [adFree, navigation]);

  const retry = () => {
    setError(null);
    setLoading(true);
    fetchPackage();
  };

  const price = pkg ? `${pkg.product.priceString}/${periodLabel(pkg.product.subscriptionPeriod) || 'month'}` : null;

  const run = async (
    action: () => Promise<{ ok: boolean; cancelled?: boolean; message?: string; found?: boolean }>,
    nothingFoundMessage?: string
  ) => {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.ok && !result.cancelled) notify('Something went wrong', result.message ?? 'Please try again.');
    else if (result.ok && result.found === false && nothingFoundMessage) notify('Nothing to restore', nothingFoundMessage);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={24} color={colors.forest} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>Dishcart</Text>
        <Text style={styles.title}>Go ad-free</Text>
        <Text style={styles.body}>
          Everything in Dishcart stays free. Subscribing just removes the ads, and helps keep new recipes coming.
        </Text>
        {loading && <ActivityIndicator color={colors.forest} />}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={retry} style={styles.secondary} accessibilityRole="button">
              <Text style={styles.secondaryLabel}>Try again</Text>
            </Pressable>
          </View>
        )}
        {price && (
          <View style={styles.priceCard}>
            <Text style={styles.price}>{price}</Text>
            <Text style={styles.priceNote}>No ads anywhere in the app. Cancel anytime.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => pkg && run(() => purchase(pkg))}
          disabled={!pkg || busy}
          style={[styles.cta, (!pkg || busy) && styles.ctaDisabled]}
          accessibilityRole="button"
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaLabel}>Remove ads{price ? ` · ${price}` : ''}</Text>}
        </Pressable>
        <Pressable onPress={() => redeemCode()} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryLabel}>Redeem a code</Text>
        </Pressable>
        {price && (
          <Text style={styles.fine}>
            {price}, renews automatically until canceled. Cancel anytime in your {store} subscriptions.
          </Text>
        )}
        <View style={styles.links}>
          <Pressable
            onPress={() => run(restore, `No active Dishcart subscription was found for this ${store} account.`)}
            disabled={busy}
            hitSlop={10}
            accessibilityRole="button"
          >
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
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, alignItems: 'flex-start' },
  scroll: { padding: spacing.xl, gap: spacing.lg },
  eyebrow: { fontSize: 15, fontWeight: '700', color: colors.goldText },
  title: { fontSize: 28, fontWeight: '700', color: colors.forest },
  body: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  priceCard: {
    padding: spacing.lg, borderRadius: radius.md, borderWidth: 2, borderColor: colors.forest,
    backgroundColor: colors.sageLight, gap: 4,
  },
  price: { fontSize: 22, fontWeight: '800', color: colors.forest },
  priceNote: { fontSize: 13.5, color: colors.inkSoft },
  errorBox: { gap: spacing.sm, alignItems: 'center' },
  errorText: { fontSize: 14, color: colors.rustText, textAlign: 'center' },
  footer: { padding: spacing.xl, paddingTop: spacing.md, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.line },
  cta: { backgroundColor: colors.forest, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center' },
  ctaDisabled: { backgroundColor: colors.inkSoft },
  ctaLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: {
    alignItems: 'center', paddingVertical: 13, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.forest,
  },
  secondaryLabel: { fontSize: 14, fontWeight: '700', color: colors.forest },
  fine: { fontSize: 11.5, color: colors.inkSoft, textAlign: 'center', lineHeight: 16 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
  link: { fontSize: 13, fontWeight: '700', color: colors.forest },
});
