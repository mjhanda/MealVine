import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, mealLabels, mealTypeOrder } from '../../theme';
import { MealType } from '../../types';
import { prefStyles } from './styles';

interface Props {
  value: MealType[];
  onChange: (mealTypes: MealType[]) => void;
}

export default function MealTypePicker({ value, onChange }: Props) {
  const toggle = (m: MealType) => onChange(value.includes(m) ? value.filter((x) => x !== m) : [...value, m]);
  return (
    <View style={prefStyles.list}>
      {mealTypeOrder.map((id) => {
        const active = value.includes(id);
        return (
          <Pressable
            key={id}
            onPress={() => toggle(id)}
            style={[prefStyles.optionCard, prefStyles.optionRow, active && prefStyles.optionCardActive]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
          >
            <Text style={prefStyles.optionLabel}>{mealLabels[id]}</Text>
            {active && <Feather name="check" size={18} color={colors.forest} />}
          </Pressable>
        );
      })}
    </View>
  );
}
