import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { RECIPES } from '../../data/recipes';
import { colors } from '../../theme';
import { DietId } from '../../types';
import { DIET_ORDER, DIETS, fitsDiet } from '../../utils/diets';
import { prefStyles } from './styles';

interface Props {
  value: DietId;
  onChange: (diet: DietId) => void;
}

export default function DietPicker({ value, onChange }: Props) {
  const counts = useMemo(
    () => Object.fromEntries(DIET_ORDER.map((d) => [d, RECIPES.filter((r) => fitsDiet(r, d)).length])),
    []
  );
  return (
    <View style={prefStyles.list} accessibilityRole="radiogroup">
      {DIET_ORDER.map((id) => {
        const active = value === id;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            style={[prefStyles.optionCard, active && prefStyles.optionCardActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
          >
            <View style={prefStyles.optionRow}>
              <Text style={prefStyles.optionLabel}>{DIETS[id].label}</Text>
              {active && <Feather name="check" size={18} color={colors.forest} />}
            </View>
            <Text style={prefStyles.optionSub}>
              {DIETS[id].description} · {counts[id]} recipes
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
