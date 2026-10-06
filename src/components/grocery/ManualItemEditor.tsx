import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { aisleOrder, colors, radius, spacing } from '../../theme';
import { Aisle, ManualGroceryItem } from '../../types';

interface Props {
  item: ManualGroceryItem;
  onSave: (changes: { name: string; aisle: Aisle }) => void;
  onDelete: () => void;
  onClose: () => void;
}

// Mounted only while editing, so its draft state starts fresh from `item` each time.
export default function ManualItemEditor({ item, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(item.name);
  const [aisle, setAisle] = useState<Aisle>(item.aisle);
  const canSave = name.trim().length > 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close editor" />
      <View style={styles.sheet}>
        <Text style={styles.title}>Edit item</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} autoFocus accessibilityLabel="Item name" />
        <Text style={styles.label}>Aisle</Text>
        <ScrollView style={styles.aisles} contentContainerStyle={styles.aisleWrap}>
          {aisleOrder.map((a) => (
            <Pressable
              key={a}
              onPress={() => setAisle(a)}
              style={[styles.chip, aisle === a && styles.chipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: aisle === a }}
            >
              <Text style={[styles.chipLabel, aisle === a && styles.chipLabelActive]}>{a}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.actions}>
          <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button">
            <Text style={styles.delete}>Delete</Text>
          </Pressable>
          <View style={styles.actionsRight}>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => canSave && onSave({ name: name.trim(), aisle })}
              disabled={!canSave}
              style={[styles.save, !canSave && styles.saveDisabled]}
              accessibilityRole="button"
            >
              <Text style={styles.saveLabel}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute', left: spacing.lg, right: spacing.lg, top: '15%', maxHeight: '75%',
    backgroundColor: colors.cream, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.forest },
  input: {
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.line,
    fontSize: 15, color: colors.ink, backgroundColor: colors.card,
  },
  label: { fontSize: 11.5, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6 },
  aisles: { flexGrow: 0 },
  aisleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1,
    borderColor: colors.line, backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipLabel: { fontSize: 13, fontWeight: '600', color: colors.ink },
  chipLabelActive: { color: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  actionsRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  delete: { color: colors.rustText, fontWeight: '700', fontSize: 14 },
  cancel: { color: colors.inkSoft, fontWeight: '700', fontSize: 14 },
  save: { backgroundColor: colors.forest, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  saveDisabled: { backgroundColor: colors.line },
  saveLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
