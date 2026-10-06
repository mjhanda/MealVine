import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { INGREDIENTS } from '../../data/ingredients';
import { useGroceryStore } from '../../store/groceryStore';
import { colors } from '../../theme';
import { prefStyles } from './styles';

// Items the user marked "I have this" on the grocery list. Changes apply immediately.
export default function PantryEditor() {
  const pantry = useGroceryStore((s) => s.pantry);
  const setPantry = useGroceryStore((s) => s.setPantry);
  const have = Object.entries(pantry)
    .filter(([, v]) => v === 'have')
    .map(([id]) => id)
    .sort((a, b) => (INGREDIENTS[a]?.name ?? a).localeCompare(INGREDIENTS[b]?.name ?? b));

  if (have.length === 0) {
    return (
      <Text style={prefStyles.note}>
        Oil, salt, and spices start in your pantry. Tap the house icon on any grocery item to add it here.
      </Text>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      <View style={prefStyles.chipWrap}>
        {have.map((id) => (
          <Pressable
            key={id}
            onPress={() => setPantry(id, null)}
            style={prefStyles.chip}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${INGREDIENTS[id]?.name ?? id} from pantry`}
          >
            <Text style={prefStyles.chipLabel}>{INGREDIENTS[id]?.name ?? id}</Text>
            <Feather name="x" size={13} color={colors.inkSoft} />
          </Pressable>
        ))}
      </View>
      <Text style={prefStyles.note}>These never appear on your shopping list. Tap one to put it back.</Text>
    </View>
  );
}
