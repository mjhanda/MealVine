import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { CookedEntry } from '../types';
import { cookedAgo } from '../utils/dates';
import { recipeById } from '../utils/recipeCatalog';

export const RECENT_LIMIT = 8;

interface Props {
  entries: CookedEntry[]; // newest first
  onCookAgain: (entry: CookedEntry) => void;
  onOpen: (recipeId: string) => void;
}

export default function RecentlyCooked({ entries, onCookAgain, onOpen }: Props) {
  // Captured once per mount; "Today"/"Yesterday" don't need to tick while the screen is open.
  const [now] = useState(Date.now);
  const recent = entries.slice(0, RECENT_LIMIT);
  if (recent.length === 0) return null;
  return (
    <View>
      <Text style={styles.label}>Recently cooked</Text>
      <View style={styles.list}>
        {recent.map((entry) => {
          const recipe = recipeById(entry.recipeId);
          if (!recipe) return null;
          return (
            <View key={entry.id} style={styles.row}>
              <Pressable style={styles.main} onPress={() => onOpen(recipe.id)} accessibilityRole="button">
                <Text style={styles.emoji}>{recipe.emoji}</Text>
                <View style={styles.text}>
                  <Text style={styles.title} numberOfLines={1}>
                    {recipe.title}
                  </Text>
                  <Text style={styles.meta}>{cookedAgo(entry.cookedAt, now)}</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => onCookAgain(entry)}
                style={styles.againBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Cook ${recipe.title} again`}
              >
                <Feather name="rotate-ccw" size={13} color={colors.forest} />
                <Text style={styles.againLabel}>Cook again</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11.5, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: spacing.sm,
  },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: { fontSize: 20 },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: 13.5, color: colors.ink, fontWeight: '600' },
  meta: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
  againBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: radius.pill, backgroundColor: colors.sageLight,
  },
  againLabel: { fontSize: 12, fontWeight: '700', color: colors.forest },
});
