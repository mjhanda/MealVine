import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../../navigation/types';
import { manageSubscription, redeemCode, restore } from '../../services/purchases';
import { useAdFree, useSubscriptionStore } from '../../store/subscriptionStore';
import { colors, radius, spacing } from '../../theme';
import { notify } from '../dialogs';
import { prefStyles } from './styles';

const fmt = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
const store = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

export default function AdsSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const adFree = useAdFree();
  const status = useSubscriptionStore((s) => s.status);
  const entitlement = useSubscriptionStore((s) => s.entitlement);
  const [busy, setBusy] = useState(false);
  const unavailable = status === 'unavailable';

  const summary = (() => {
    if (unavailable) return Platform.OS === 'web' ? 'Ad-free is available in the mobile app.' : 'Ad-free is unavailable in this build.';
    if (!adFree) return 'Dishcart is free with ads. Remove them anytime.';
    const until = entitlement?.expiresAt ? fmt(entitlement.expiresAt) : null;
    if (!until) return 'Ad-free. Thanks for supporting Dishcart!';
    return entitlement?.willRenew ? `Ad-free — renews ${until}.` : `Ad-free until ${until}.`;
  })();

  const handleRestore = async () => {
    setBusy(true);
    const result = await restore();
    setBusy(false);
    if (!result.ok) notify("Couldn't restore", result.message);
    else notify(result.found ? 'Restored' : 'Nothing to restore', result.found ? 'Ads are off.' : `No active Dishcart subscription was found for this ${store} account.`);
  };

  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.summary}>{summary}</Text>
      {!unavailable && (
        <>
          {adFree ? (
            <Pressable onPress={manageSubscription} style={styles.btn} accessibilityRole="button">
              <Text style={styles.label}>Manage subscription</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => navigation.navigate('RemoveAds')} style={[styles.btn, styles.primary]} accessibilityRole="button">
              <Text style={[styles.label, styles.primaryLabel]}>Remove ads</Text>
            </Pressable>
          )}
          <View style={styles.row}>
            <Pressable onPress={() => redeemCode()} style={styles.btn} accessibilityRole="button">
              <Text style={styles.label}>Redeem a code</Text>
            </Pressable>
            <Pressable onPress={handleRestore} disabled={busy} style={styles.btn} accessibilityRole="button">
              <Text style={styles.label}>{busy ? 'Restoring…' : 'Restore purchases'}</Text>
            </Pressable>
          </View>
        </>
      )}
      {!unavailable && <Text style={prefStyles.note}>Billing and cancellation are handled by your {store} account.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 13,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.forest,
  },
  primary: { backgroundColor: colors.forest },
  label: { fontSize: 14, fontWeight: '700', color: colors.forest },
  primaryLabel: { color: '#fff' },
});
