import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { manageSubscription, restore } from '../../services/purchases';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { colors, radius, spacing } from '../../theme';
import { notify } from '../dialogs';
import { prefStyles } from './styles';

const fmt = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

export default function SubscriptionSection() {
  const status = useSubscriptionStore((s) => s.status);
  const entitlement = useSubscriptionStore((s) => s.entitlement);
  const [busy, setBusy] = useState(false);

  const summary = (() => {
    if (status === 'unavailable') return Platform.OS === 'web' ? 'Subscriptions are managed in the mobile app.' : 'Subscriptions are unavailable in this build.';
    if (status === 'loading') return 'Checking your subscription…';
    if (status === 'offline') return "Offline — we'll check your subscription when you're back online.";
    if (!entitlement?.isActive) return 'No active subscription.';
    const until = entitlement.expiresAt ? fmt(entitlement.expiresAt) : null;
    if (entitlement.isTrial) return until ? `Free trial — ${entitlement.willRenew ? 'subscription starts' : 'ends'} ${until}.` : 'Free trial active.';
    if (!until) return 'MealVine subscription active.';
    return entitlement.willRenew ? `Active — renews ${until}.` : `Active until ${until} (won't renew).`;
  })();

  const handleRestore = async () => {
    setBusy(true);
    const result = await restore();
    setBusy(false);
    if (!result.ok) notify("Couldn't restore", result.message);
    else notify(result.found ? 'Restored' : 'Nothing to restore', result.found ? 'Your subscription is active.' : 'No active subscription was found for this store account.');
  };

  const canManage = status !== 'unavailable';
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.summary}>{summary}</Text>
      {canManage && (
        <View style={styles.row}>
          <Pressable onPress={manageSubscription} style={styles.btn} accessibilityRole="button">
            <Text style={styles.label}>Manage subscription</Text>
          </Pressable>
          <Pressable onPress={handleRestore} disabled={busy} style={styles.btn} accessibilityRole="button">
            <Text style={styles.label}>{busy ? 'Restoring…' : 'Restore purchases'}</Text>
          </Pressable>
        </View>
      )}
      <Text style={prefStyles.note}>Billing and cancellation are handled by your {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} account.</Text>
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
  label: { fontSize: 14, fontWeight: '700', color: colors.forest },
});
