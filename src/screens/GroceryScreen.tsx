import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGroceryStore } from '../store/groceryStore';
import { usePlanStore } from '../store/planStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { categoryOrder, colors } from '../theme';
import { groceryItemsFromPlan, groceryKey } from '../utils/grocery';
import { unitLabel } from '../utils/units';

export default function GroceryScreen() {
  const plan = usePlanStore((s) => s.plan);
  const householdSize = usePreferencesStore((s) => s.householdSize);
  const checked = useGroceryStore((s) => s.checked);
  const toggleCheck = useGroceryStore((s) => s.toggleCheck);
  const manualItems = useGroceryStore((s) => s.manualItems);
  const addManual = useGroceryStore((s) => s.addManual);
  const removeManual = useGroceryStore((s) => s.removeManual);
  const [newItem, setNewItem] = useState('');

  const grouped = useMemo(
    () => (plan ? groceryItemsFromPlan(plan, householdSize) : {}),
    [plan, householdSize]
  );

  const totalItems =
    Object.values(grouped).reduce((n, list) => n + list.length, 0) + manualItems.length;
  const checkedCount =
    Object.values(grouped).reduce(
      (n, list) => n + list.filter((it) => checked[groceryKey(it.name, it.unit)]).length,
      0
    ) + manualItems.filter((m) => checked[`manual__${m.id}`]).length;

  const handleAdd = () => {
    const name = newItem.trim();
    if (!name) return;
    addManual(name);
    setNewItem('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Auto-generated</Text>
        <Text style={styles.title}>Grocery list</Text>
        <Text style={styles.subtitle}>
          {checkedCount} of {totalItems} picked up
        </Text>
        <View style={styles.addRow}>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={handleAdd}
            placeholder="Add an item"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
          />
          <Pressable onPress={handleAdd} style={styles.addBtn}>
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 20 }}>
        {!plan && <Text style={styles.emptyText}>Build a meal plan to generate your list.</Text>}
        {categoryOrder.map((cat) => {
          const items = grouped[cat] || [];
          const manuals = manualItems.filter((m) => m.category === cat);
          if (items.length === 0 && manuals.length === 0) return null;
          return (
            <View key={cat}>
              <Text style={styles.categoryHeader}>{cat}</Text>
              <View style={{ gap: 6 }}>
                {items.map((item) => {
                  const key = groceryKey(item.name, item.unit);
                  const isChecked = !!checked[key];
                  return (
                    <Pressable key={key} onPress={() => toggleCheck(key)} style={styles.row}>
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Feather name="check" size={13} color="#fff" />}
                      </View>
                      <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemAmount}>{unitLabel(item.amount, item.unit)}</Text>
                    </Pressable>
                  );
                })}
                {manuals.map((m) => {
                  const key = `manual__${m.id}`;
                  const isChecked = !!checked[key];
                  return (
                    <Pressable key={key} onPress={() => toggleCheck(key)} style={styles.row}>
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Feather name="check" size={13} color="#fff" />}
                      </View>
                      <Text style={[styles.itemName, isChecked && styles.itemNameChecked]}>{m.name}</Text>
                      <Pressable onPress={() => removeManual(m.id)} hitSlop={8}>
                        <Feather name="x" size={16} color={colors.inkSoft} />
                      </Pressable>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest },
  subtitle: { fontSize: 12.5, color: colors.inkSoft, marginTop: 4 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: colors.line, fontSize: 13.5, color: colors.ink, backgroundColor: colors.card,
  },
  addBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: colors.forest,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', marginTop: 40 },
  categoryHeader: {
    fontSize: 11.5, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 8,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.sage, borderColor: colors.sage },
  itemName: { flex: 1, fontSize: 14, color: colors.ink },
  itemNameChecked: { color: colors.inkSoft, textDecorationLine: 'line-through' },
  itemAmount: { fontSize: 13, color: colors.inkSoft, fontWeight: '600' },
});
