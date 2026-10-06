import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

export const MIN_HOUSEHOLD = 1;
export const MAX_HOUSEHOLD = 8;

interface Props {
  value: number;
  onChange: (n: number) => void;
  large?: boolean;
}

export default function HouseholdStepper({ value, onChange, large = false }: Props) {
  const btn = large ? styles.btnLarge : styles.btn;
  return (
    <View style={[styles.row, large && styles.rowLarge]}>
      <Pressable
        onPress={() => onChange(Math.max(MIN_HOUSEHOLD, value - 1))}
        disabled={value <= MIN_HOUSEHOLD}
        style={btn}
        accessibilityRole="button"
        accessibilityLabel="Fewer people"
      >
        <Feather name="minus" size={large ? 18 : 16} color={colors.forest} />
      </Pressable>
      <View style={styles.valueWrap} accessibilityLiveRegion="polite">
        <Text style={large ? styles.valueLarge : styles.value}>{value}</Text>
        {large && <Text style={styles.unit}>{value === 1 ? 'person' : 'people'}</Text>}
      </View>
      <Pressable
        onPress={() => onChange(Math.min(MAX_HOUSEHOLD, value + 1))}
        disabled={value >= MAX_HOUSEHOLD}
        style={btn}
        accessibilityRole="button"
        accessibilityLabel="More people"
      >
        <Feather name="plus" size={large ? 18 : 16} color={colors.forest} />
      </Pressable>
    </View>
  );
}

const circle = { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sageLight } as const;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rowLarge: { justifyContent: 'center', gap: 20 },
  btn: { ...circle, width: 44, height: 44, borderRadius: 22 },
  btnLarge: { ...circle, width: 48, height: 48, borderRadius: 24 },
  valueWrap: { alignItems: 'center', minWidth: 44 },
  value: { fontSize: 20, fontWeight: '700', color: colors.forest },
  valueLarge: { fontSize: 44, fontWeight: '600', color: colors.forest },
  unit: { fontSize: 12, color: colors.inkSoft },
});
