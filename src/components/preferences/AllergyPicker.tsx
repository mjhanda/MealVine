import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../theme';
import { AllergenTag } from '../../types';
import { ALLERGENS } from '../../utils/diets';
import { prefStyles } from './styles';

export const ALLERGY_DISCLAIMER =
  "We hide recipes containing ingredients that commonly include these allergens, but we can't guarantee " +
  'any product is free of them. Always check labels.';

interface Props {
  value: AllergenTag[];
  onChange: (allergies: AllergenTag[]) => void;
}

export default function AllergyPicker({ value, onChange }: Props) {
  const toggle = (id: AllergenTag) =>
    onChange(value.includes(id) ? value.filter((a) => a !== id) : [...value, id]);
  return (
    <View style={{ gap: 14 }}>
      <View style={prefStyles.chipWrap}>
        {ALLERGENS.map(({ id, label }) => {
          const active = value.includes(id);
          return (
            <Pressable
              key={id}
              onPress={() => toggle(id)}
              style={[prefStyles.chip, active && prefStyles.chipActive]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${label} allergy`}
            >
              {active && <Feather name="slash" size={13} color={colors.rust} />}
              <Text style={prefStyles.chipLabel}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={prefStyles.note}>{ALLERGY_DISCLAIMER}</Text>
    </View>
  );
}
