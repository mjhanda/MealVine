import { Feather } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Recipe } from '../types';
import DietTag from './DietTag';

interface Props {
  recipe: Recipe;
  onPress: () => void;
  right?: ReactNode;
}

export default function RecipeCard({ recipe, onPress, right }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.emojiWrap}>
        <Text style={styles.emoji}>{recipe.emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.title}
        </Text>
        <View style={styles.metaRow}>
          <DietTag diet={recipe.diet} />
          <View style={styles.timeRow}>
            <Feather name="clock" size={12} color={colors.inkSoft} />
            <Text style={styles.timeText}>{recipe.prep + recipe.cook}m</Text>
          </View>
        </View>
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 12,
  },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  body: { flex: 1, minWidth: 0 },
  title: { fontWeight: '700', fontSize: 14.5, color: colors.ink, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeText: { fontSize: 12, color: colors.inkSoft },
});
