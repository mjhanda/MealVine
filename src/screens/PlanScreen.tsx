import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeCard from '../components/RecipeCard';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { usePlanStore } from '../store/planStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { colors, mealLabels, mealPlural, mealTypeOrder } from '../theme';
import { MealType } from '../types';
import { recipeById } from '../utils/recipeCatalog';

type Nav = NativeStackNavigationProp<RootStackParamList & MainTabParamList>;

interface PlanGroup {
  mealType: MealType;
  itemIds: string[];
}

function buildGroups(mealTypes: MealType[], items: { id: string; recipeId: string }[]): PlanGroup[] {
  const order = [...mealTypes, ...mealTypeOrder.filter((t) => !mealTypes.includes(t))];
  const groups = order.map((mealType) => ({
    mealType,
    itemIds: items
      .filter((item) => recipeById(item.recipeId)?.mealType === mealType)
      .map((item) => item.id),
  }));
  return groups.filter((group) => group.itemIds.length > 0);
}

export default function PlanScreen() {
  const navigation = useNavigation<Nav>();
  const plan = usePlanStore((s) => s.plan);
  const removeItem = usePlanStore((s) => s.removeItem);
  const clear = usePlanStore((s) => s.clear);
  const mealTypes = usePreferencesStore((s) => s.mealTypes);

  const groups = useMemo(() => buildGroups(mealTypes, plan.items), [mealTypes, plan.items]);
  const total = plan.items.length;

  const handleClear = () => {
    if (total === 0) return;
    Alert.alert('Clear your plan?', `Removes all ${total} meal${total === 1 ? '' : 's'} and rebuilds the grocery list from nothing.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Meal planner</Text>
          <Text style={styles.title}>Your plan</Text>
          {total > 0 && <Text style={styles.subtitle}>{total} meal{total === 1 ? '' : 's'} picked</Text>}
        </View>
        <Pressable onPress={handleClear} disabled={total === 0} style={[styles.iconBtn, total === 0 && styles.iconBtnDisabled]} hitSlop={8}>
          <Feather name="trash-2" size={16} color={total === 0 ? colors.line : colors.forest} />
        </Pressable>
      </View>

      {total === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No meals yet</Text>
          <Text style={styles.emptyText}>
            Search recipes in the Browse tab and tap + to build your plan. Your grocery list
            updates automatically.
          </Text>
          <Pressable onPress={() => navigation.navigate('Browse')} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnLabel}>Browse recipes</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
          {groups.map((group) => (
            <View key={group.mealType}>
              <Text style={styles.mealLabel}>{mealPlural[group.mealType]}</Text>
              <View style={{ gap: 10 }}>
                {group.itemIds.map((itemId) => {
                  const item = plan.items.find((i) => i.id === itemId);
                  const recipe = item && recipeById(item.recipeId);
                  if (!item || !recipe) return null;
                  return (
                    <RecipeCard
                      key={itemId}
                      recipe={recipe}
                      onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                      right={
                        <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                          <Feather name="x" size={18} color={colors.inkSoft} />
                        </Pressable>
                      }
                    />
                  );
                })}
              </View>
            </View>
          ))}
          <View style={styles.footerNote}>
            <Text style={styles.footerText}>
              Tip: use the {mealLabels.snack.toLowerCase()}s in Browse to round out your day.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest },
  subtitle: { fontSize: 12.5, color: colors.inkSoft, marginTop: 4 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  iconBtnDisabled: { borderColor: colors.line, opacity: 0.6 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.ink },
  emptyText: { fontSize: 14, color: colors.inkSoft, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 10, backgroundColor: colors.forest, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  emptyBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  mealLabel: {
    fontSize: 11.5, fontWeight: '800', color: colors.inkSoft, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: 8,
  },
  footerNote: { marginTop: 8, alignItems: 'center' },
  footerText: { fontSize: 12.5, color: colors.inkSoft, textAlign: 'center' },
});
