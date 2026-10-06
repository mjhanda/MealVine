import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';
import { ShoppingRow } from '../../utils/shoppingList';

interface Props {
  row: ShoppingRow;
  onToggle: () => void;
  // Trailing action: "I have this" for recipe items, edit for manual items, "Need it" in the pantry.
  action?: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void };
  muted?: boolean;
}

export default function GroceryRow({ row, onToggle, action, muted = false }: Props) {
  return (
    <View style={[styles.row, muted && styles.rowMuted]}>
      <Pressable
        onPress={onToggle}
        style={styles.main}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: row.checked }}
        accessibilityLabel={row.quantity ? `${row.name}, ${row.quantity}` : row.name}
      >
        <View style={[styles.checkbox, row.checked && styles.checkboxChecked]}>
          {row.checked && <Feather name="check" size={13} color="#fff" />}
        </View>
        <Text style={[styles.name, row.checked && styles.nameChecked]}>{row.name}</Text>
        {row.quantity && <Text style={styles.amount}>{row.quantity}</Text>}
      </Pressable>
      {action ? (
        <Pressable
          onPress={action.onPress}
          style={styles.action}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Feather name={action.icon} size={15} color={colors.inkSoft} />
        </Pressable>
      ) : (
        <View style={styles.actionSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm + 2, paddingLeft: 12,
  },
  rowMuted: { backgroundColor: 'transparent' },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.sage, borderColor: colors.sage },
  name: { flex: 1, fontSize: 14, color: colors.ink },
  nameChecked: { color: colors.inkSoft, textDecorationLine: 'line-through' },
  amount: { fontSize: 13, color: colors.inkSoft, fontWeight: '600' },
  action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  actionSpacer: { width: 12 },
});
