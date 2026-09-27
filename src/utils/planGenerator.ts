import { RECIPES } from '../data/recipes';
import { Day, DietPref, MealPlan, MealType, Recipe } from '../types';
import { days } from '../theme';

const RECENT_WINDOW = 6;

export function recipesForDiet(mealType: MealType, dietPref: DietPref): Recipe[] {
  const pool = RECIPES.filter((r) => r.mealType === mealType);
  if (dietPref === 'vegetarian') return pool.filter((r) => r.diet === 'vegetarian');
  return pool;
}

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export function generatePlan(mealTypes: MealType[], diet: DietPref): MealPlan {
  const entries = {} as MealPlan['entries'];
  const usedRecently: string[] = [];

  (days as readonly Day[]).forEach((day) => {
    entries[day] = {};
    mealTypes.forEach((mealType) => {
      const pool = recipesForDiet(mealType, diet);
      const fresh = pool.filter((r) => !usedRecently.includes(r.id));
      const choices = fresh.length ? fresh : pool;
      const pick = pickRandom(choices);
      if (pick) {
        entries[day][mealType] = pick.id;
        usedRecently.push(pick.id);
        if (usedRecently.length > RECENT_WINDOW) usedRecently.shift();
      }
    });
  });

  return { entries };
}

export function swapMeal(plan: MealPlan, day: Day, mealType: MealType, diet: DietPref): MealPlan {
  const pool = recipesForDiet(mealType, diet);
  const currentId = plan.entries[day]?.[mealType];
  const others = pool.filter((r) => r.id !== currentId);
  const choices = others.length ? others : pool;
  const pick = pickRandom(choices);
  if (!pick) return plan;
  return {
    entries: {
      ...plan.entries,
      [day]: { ...plan.entries[day], [mealType]: pick.id },
    },
  };
}

export function setMealInPlan(plan: MealPlan, day: Day, mealType: MealType, recipeId: string): MealPlan {
  return {
    entries: {
      ...plan.entries,
      [day]: { ...plan.entries[day], [mealType]: recipeId },
    },
  };
}

export function recipeById(id: string | undefined): Recipe | undefined {
  if (!id) return undefined;
  return RECIPES.find((r) => r.id === id);
}
