import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeCard from '../components/RecipeCard';
import { RootStackParamList } from '../navigation/types';
import { useFavoritesStore } from '../store/favoritesStore';
import { colors } from '../theme';
import { RECIPES } from '../data/recipes';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const favorites = useFavoritesStore((s) => s.favorites);
  const favoriteRecipes = RECIPES.filter((r) => favorites.includes(r.id));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Saved</Text>
        <Text style={styles.title}>Favorites</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
        {favoriteRecipes.length === 0 && (
          <Text style={styles.emptyText}>Tap the heart on any recipe to save it here.</Text>
        )}
        {favoriteRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  eyebrow: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '600', color: colors.forest },
  emptyText: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', marginTop: 40 },
});
