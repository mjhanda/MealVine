import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Rating, useRecipeNotesStore } from '../store/recipeNotesStore';
import { colors } from '../theme';

export default function RatingButtons({ recipeId, size = 18 }: { recipeId: string; size?: number }) {
  const rating = useRecipeNotesStore((s) => s.ratings[recipeId]);
  const rate = useRecipeNotesStore((s) => s.rate);
  const button = (value: Rating, icon: 'thumbs-up' | 'thumbs-down', label: string) => {
    const active = rating === value;
    return (
      <Pressable
        onPress={() => rate(recipeId, value)}
        style={[styles.btn, active && (value === 'up' ? styles.up : styles.down)]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        <Feather name={icon} size={size} color={active ? '#fff' : colors.inkSoft} />
      </Pressable>
    );
  };
  return (
    <View style={styles.row}>
      {button('up', 'thumbs-up', 'Liked it')}
      {button('down', 'thumbs-down', "Didn't like it")}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card,
  },
  up: { backgroundColor: colors.sage, borderColor: colors.sage },
  down: { backgroundColor: colors.rust, borderColor: colors.rust },
});
