import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { useAdFree } from '../store/subscriptionStore';
import { colors, radius, spacing } from '../theme';
import { getAdProvider, showAdPlaceholders } from './registry';
import { AdPlacement } from './types';

// Renders an ad for a placement — or nothing for ad-free subscribers, or when no ad network is
// configured (release builds then show no ads at all).
export default function AdSlot({ placement }: { placement: AdPlacement }) {
  const adFree = useAdFree();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const provider = getAdProvider();
  if (adFree) return null;
  if (!provider && !showAdPlaceholders()) return null;

  return (
    <View style={styles.wrap} accessibilityLabel="Advertisement">
      {provider ? (
        <provider.Banner placement={placement} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Ad slot · {placement} (dev placeholder)</Text>
        </View>
      )}
      <Pressable
        onPress={() => navigation.navigate('RemoveAds')}
        hitSlop={{ top: 12, bottom: 12 }}
        accessibilityRole="button"
        style={styles.removeLink}
      >
        <Text style={styles.removeText}>Remove ads</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  placeholder: {
    height: 60, borderRadius: radius.sm, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  placeholderText: { fontSize: 12, color: colors.inkSoft },
  removeLink: { alignSelf: 'flex-end', paddingHorizontal: spacing.xs },
  removeText: { fontSize: 12, fontWeight: '700', color: colors.forest },
});
