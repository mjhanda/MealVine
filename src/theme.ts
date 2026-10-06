import { Aisle, MealType, Protein } from './types';

export const colors = {
  cream: '#FAF6EE',
  forest: '#22392C',
  forestSoft: '#3A5842',
  sage: '#7C9A73',
  sageLight: '#E4ECDE',
  gold: '#C99A3C',
  goldLight: '#F3E4BF',
  rust: '#B5583A',
  rustLight: '#F1DCD2',
  ink: '#20241F',
  inkSoft: '#5B6459',
  line: '#E4DECE',
  card: '#FFFFFF',
  blue: '#3E6E8E',
  blueLight: '#DCE9F1',
  // Text-safe shades: the base gold/sage/rust/blue fail WCAG AA (4.5:1) as small text on the
  // light backgrounds. Use these for any text; keep the base colors for fills, icons, borders.
  goldText: '#7D5F25',
  sageText: '#586D52',
  rustText: '#9A4B31',
  blueText: '#3C6B8A',
};

export const proteinMeta: Record<Protein, { label: string; color: string; bg: string }> = {
  vegetarian: { label: 'Vegetarian', color: colors.sageText, bg: colors.sageLight },
  chicken: { label: 'Chicken', color: colors.rustText, bg: colors.rustLight },
  turkey: { label: 'Turkey', color: colors.rustText, bg: colors.rustLight },
  beef: { label: 'Beef', color: colors.rustText, bg: colors.rustLight },
  pork: { label: 'Pork', color: colors.rustText, bg: colors.rustLight },
  lamb: { label: 'Lamb', color: colors.rustText, bg: colors.rustLight },
  fish: { label: 'Seafood', color: colors.blueText, bg: colors.blueLight },
};

export const mealLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const mealPlural: Record<MealType, string> = {
  breakfast: 'Breakfasts',
  lunch: 'Lunches',
  dinner: 'Dinners',
  snack: 'Snacks',
};

export const mealTypeOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

// Roughly the order you walk a typical store; grocery list sections follow it.
export const aisleOrder: Aisle[] = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery & Bread',
  'Pasta, Rice & Grains',
  'Canned & Jarred',
  'Oils & Condiments',
  'Spices & Baking',
  'Snacks & Nuts',
  'Frozen',
  'Beverages',
  'Household',
  'Other',
];

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const radius = { sm: 10, md: 14, lg: 16, pill: 20, round: 999 };
