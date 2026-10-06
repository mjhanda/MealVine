import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { INGREDIENTS } from '../../data/ingredients';
import { colors, radius, spacing } from '../../theme';
import { prefStyles } from './styles';

// Common dislikes offered before the user searches.
export const QUICK_DISLIKES = ['portobello', 'kalamata-olives', 'firm-tofu', 'shrimp', 'eggplant', 'capers', 'cottage-cheese', 'beet'];
const MAX_RESULTS = 8;

interface Props {
  value: string[]; // ingredient ids
  onChange: (dislikes: string[]) => void;
}

export function searchIngredients(query: string, exclude: string[]): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return Object.values(INGREDIENTS)
    .filter((d) => !exclude.includes(d.id))
    .filter((d) => [d.name, d.plural ?? ''].some((n) => n.toLowerCase().includes(q)))
    .sort((a, b) => Number(!a.name.toLowerCase().startsWith(q)) - Number(!b.name.toLowerCase().startsWith(q)) || a.name.localeCompare(b.name))
    .slice(0, MAX_RESULTS)
    .map((d) => d.id);
}

export default function DislikePicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchIngredients(query, value), [query, value]);
  const suggestions = query ? results : QUICK_DISLIKES.filter((id) => !value.includes(id));

  const add = (id: string) => {
    onChange([...value, id]);
    setQuery('');
  };
  const remove = (id: string) => onChange(value.filter((d) => d !== id));

  return (
    <View style={{ gap: 14 }}>
      {value.length > 0 && (
        <View style={prefStyles.chipWrap}>
          {value.map((id) => (
            <Pressable
              key={id}
              onPress={() => remove(id)}
              style={[prefStyles.chip, prefStyles.chipActive]}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${INGREDIENTS[id]?.name ?? id} from dislikes`}
            >
              <Text style={prefStyles.chipLabel}>{INGREDIENTS[id]?.name ?? id}</Text>
              <Feather name="x" size={13} color={colors.rust} />
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.search}>
        <Feather name="search" size={16} color={colors.inkSoft} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search ingredients"
          placeholderTextColor={colors.inkSoft}
          style={styles.input}
          autoCorrect={false}
          accessibilityLabel="Search ingredients to avoid"
        />
      </View>
      <View style={prefStyles.chipWrap}>
        {suggestions.map((id) => (
          <Pressable key={id} onPress={() => add(id)} style={prefStyles.chip} accessibilityRole="button" accessibilityLabel={`Avoid ${INGREDIENTS[id].name}`}>
            <Feather name="plus" size={13} color={colors.inkSoft} />
            <Text style={prefStyles.chipLabel}>{INGREDIENTS[id].name}</Text>
          </Pressable>
        ))}
        {query.length > 0 && results.length === 0 && <Text style={prefStyles.note}>No matching ingredients.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: radius.sm + 2, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card,
  },
  input: { flex: 1, fontSize: 14, color: colors.ink },
});
