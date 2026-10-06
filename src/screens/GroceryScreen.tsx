import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { confirmAction, shareText } from '../components/dialogs';
import GroceryRow from '../components/grocery/GroceryRow';
import ManualItemEditor from '../components/grocery/ManualItemEditor';
import { manualKey, useGroceryStore } from '../store/groceryStore';
import { usePlanStore } from '../store/planStore';
import { useUndoStore } from '../store/undoStore';
import { colors } from '../theme';
import { groceryLinesFromPlan } from '../utils/grocery';
import { buildShoppingList, formatShareText } from '../utils/shoppingList';

export default function GroceryScreen() {
  const plan = usePlanStore((s) => s.plan);
  const checked = useGroceryStore((s) => s.checked);
  const manualItems = useGroceryStore((s) => s.manualItems);
  const pantry = useGroceryStore((s) => s.pantry);
  const toggleCheck = useGroceryStore((s) => s.toggleCheck);
  const addManual = useGroceryStore((s) => s.addManual);
  const removeManual = useGroceryStore((s) => s.removeManual);
  const updateManual = useGroceryStore((s) => s.updateManual);
  const clearChecked = useGroceryStore((s) => s.clearChecked);
  const setPantry = useGroceryStore((s) => s.setPantry);
  const showUndo = useUndoStore((s) => s.show);

  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pantryOpen, setPantryOpen] = useState(false);

  const list = useMemo(
    () => buildShoppingList({ lines: groceryLinesFromPlan(plan), manualItems, checked, pantry, manualKey }),
    [plan, manualItems, checked, pantry]
  );
  const editing = manualItems.find((m) => m.id === editingId);
  const isEmpty = list.total === 0 && list.pantry.length === 0;

  const handleAdd = () => {
    const name = newItem.trim();
    if (!name) return;
    addManual(name);
    setNewItem('');
  };

  const handleUncheckAll = () =>
    confirmAction('Uncheck everything?', 'Every item goes back on your list as not yet picked up.', 'Uncheck all', clearChecked);

  const markHave = (ingredientId: string, name: string) => {
    const previous = pantry[ingredientId] ?? null;
    setPantry(ingredientId, 'have');
    showUndo(`${name} moved to your pantry`, () => setPantry(ingredientId, previous));
  };

  // A catalog staple the user needs gets an explicit 'need'; a user-marked 'have' is just cleared.
  const markNeed = (ingredientId: string) => setPantry(ingredientId, pantry[ingredientId] === 'have' ? null : 'need');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.eyebrow}>Auto-generated</Text>
            <Text style={styles.title}>Grocery list</Text>
            <Text style={styles.subtitle}>
              {list.checkedCount} of {list.total} picked up
            </Text>
          </View>
          <View style={styles.headerActions}>
            {list.checkedCount > 0 && (
              <Pressable onPress={handleUncheckAll} hitSlop={8} accessibilityRole="button">
                <Text style={styles.headerAction}>Uncheck all</Text>
              </Pressable>
            )}
            {list.total > list.checkedCount && (
              <Pressable
                onPress={() => shareText('Grocery list', formatShareText(list))}
                style={styles.iconBtn}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Share grocery list"
              >
                <Feather name="share" size={16} color={colors.forest} />
              </Pressable>
            )}
          </View>
        </View>
        <View style={styles.addRow}>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={handleAdd}
            placeholder="Add an item"
            placeholderTextColor={colors.inkSoft}
            style={styles.input}
            accessibilityLabel="Add an item"
          />
          <Pressable onPress={handleAdd} style={styles.addBtn} accessibilityRole="button" accessibilityLabel="Add item">
            <Feather name="plus" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {isEmpty && <Text style={styles.emptyText}>Add meals to your plan to generate your list.</Text>}

        {list.sections.map((section) => (
          <View key={section.aisle}>
            <Text style={styles.categoryHeader}>{section.aisle}</Text>
            <View style={styles.rows}>
              {section.rows.map((row) => (
                <GroceryRow
                  key={row.key}
                  row={row}
                  onToggle={() => toggleCheck(row.key)}
                  action={
                    row.manualId
                      ? { icon: 'edit-2', label: `Edit ${row.name}`, onPress: () => setEditingId(row.manualId!) }
                      : { icon: 'home', label: `I already have ${row.name}`, onPress: () => markHave(row.ingredientId!, row.name) }
                  }
                />
              ))}
            </View>
          </View>
        ))}

        {list.pantry.length > 0 && (
          <View>
            <Pressable
              onPress={() => setPantryOpen((v) => !v)}
              style={styles.pantryHeader}
              accessibilityRole="button"
              accessibilityState={{ expanded: pantryOpen }}
            >
              <Text style={styles.categoryHeader}>Probably in your pantry ({list.pantry.length})</Text>
              <Feather name={pantryOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.inkSoft} />
            </Pressable>
            {pantryOpen && (
              <View style={styles.rows}>
                <Text style={styles.pantryHint}>Not counted above. Tap the cart on anything you need to buy.</Text>
                {list.pantry.map((row) => (
                  <GroceryRow
                    key={row.key}
                    row={row}
                    muted
                    onToggle={() => toggleCheck(row.key)}
                    action={{
                      icon: 'shopping-cart',
                      label: `I need to buy ${row.name}`,
                      onPress: () => markNeed(row.ingredientId!),
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {editing && (
        <ManualItemEditor
          item={editing}
          onClose={() => setEditingId(null)}
          onSave={(changes) => {
            updateManual(editing.id, changes);
            setEditingId(null);
          }}
          onDelete={() => {
            removeManual(editing.id);
            setEditingId(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  eyebrow: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest },
  subtitle: { fontSize: 12.5, color: colors.inkSoft, marginTop: 4 },
  headerAction: { fontSize: 13, fontWeight: '700', color: colors.forest },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: colors.line, fontSize: 13.5, color: colors.ink, backgroundColor: colors.card,
  },
  addBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: colors.forest,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: 20, paddingTop: 4, paddingBottom: 96, gap: 20 },
  rows: { gap: 6 },
  emptyText: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', marginTop: 40 },
  categoryHeader: {
    fontSize: 11.5, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 8,
  },
  pantryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pantryHint: { fontSize: 12, color: colors.inkSoft, marginBottom: 2 },
});
