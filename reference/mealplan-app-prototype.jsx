import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CalendarDays,
  ShoppingCart,
  Heart,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  RefreshCw,
  X,
  Minus,
  Users,
  Clock,
  Flame,
  Leaf,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Fonts / tokens                                                     */
/* ------------------------------------------------------------------ */

const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Manrope:wght@400;500;600;700;800&display=swap');
    .mp-serif { font-family: 'Fraunces', serif; }
    .mp-sans { font-family: 'Manrope', sans-serif; }
    .mp-scroll::-webkit-scrollbar { display: none; }
    .mp-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

const COLORS = {
  cream: "#FAF6EE",
  forest: "#22392C",
  forestSoft: "#3A5842",
  sage: "#7C9A73",
  sageLight: "#E4ECDE",
  gold: "#C99A3C",
  goldLight: "#F3E4BF",
  rust: "#B5583A",
  rustLight: "#F1DCD2",
  ink: "#20241F",
  inkSoft: "#5B6459",
  line: "#E4DECE",
  card: "#FFFFFF",
};

const DIET_META = {
  vegetarian: { label: "Vegetarian", color: COLORS.sage, bg: COLORS.sageLight },
  chicken: { label: "Chicken", color: COLORS.rust, bg: COLORS.rustLight },
  turkey: { label: "Turkey", color: COLORS.rust, bg: COLORS.rustLight },
  fish: { label: "Seafood", color: "#3E6E8E", bg: "#DCE9F1" },
};

const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CATEGORY_ORDER = [
  "Produce",
  "Protein",
  "Dairy & Eggs",
  "Grains & Bread",
  "Pantry & Canned",
  "Condiments & Spices",
];

/* ------------------------------------------------------------------ */
/*  Recipe data — curated, lean protein / mostly vegetarian, no pork   */
/* ------------------------------------------------------------------ */

const RECIPES = [
  {
    id: "r1", title: "Greek Yogurt Berry Parfait", mealType: "breakfast", diet: "vegetarian",
    prep: 5, cook: 0, servings: 2, emoji: "🫐",
    ingredients: [
      { name: "Plain Greek yogurt", amount: 2, unit: "cup", category: "Dairy & Eggs" },
      { name: "Mixed berries", amount: 1.5, unit: "cup", category: "Produce" },
      { name: "Granola", amount: 0.5, unit: "cup", category: "Pantry & Canned" },
      { name: "Honey", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Spoon half the yogurt into two glasses or bowls.",
      "Layer in half the berries and granola.",
      "Repeat the layers with remaining yogurt, berries, and granola.",
      "Drizzle with honey and serve.",
    ],
  },
  {
    id: "r2", title: "Veggie Egg Scramble", mealType: "breakfast", diet: "vegetarian",
    prep: 8, cook: 7, servings: 2, emoji: "🍳",
    ingredients: [
      { name: "Eggs", amount: 4, unit: null, category: "Dairy & Eggs" },
      { name: "Bell pepper", amount: 1, unit: null, category: "Produce" },
      { name: "Baby spinach", amount: 2, unit: "cup", category: "Produce" },
      { name: "Cherry tomatoes", amount: 0.5, unit: "cup", category: "Produce" },
      { name: "Olive oil", amount: 1, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Salt & pepper", amount: 1, unit: "pinch", category: "Condiments & Spices" },
    ],
    steps: [
      "Dice bell pepper and halve cherry tomatoes.",
      "Heat olive oil in a pan over medium heat; sauté pepper for 2 minutes.",
      "Whisk eggs and pour into the pan with spinach and tomatoes.",
      "Scramble gently until just set, season, and serve.",
    ],
  },
  {
    id: "r3", title: "Overnight Oats with Chia", mealType: "breakfast", diet: "vegetarian",
    prep: 5, cook: 0, servings: 2, emoji: "🥣",
    ingredients: [
      { name: "Rolled oats", amount: 1, unit: "cup", category: "Grains & Bread" },
      { name: "Chia seeds", amount: 2, unit: "tbsp", category: "Pantry & Canned" },
      { name: "Milk (or milk alternative)", amount: 1.5, unit: "cup", category: "Dairy & Eggs" },
      { name: "Banana", amount: 1, unit: null, category: "Produce" },
      { name: "Cinnamon", amount: 1, unit: "tsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Stir oats, chia seeds, milk, and cinnamon together in a jar.",
      "Slice banana and fold half in; save the rest for topping.",
      "Cover and refrigerate overnight.",
      "Top with remaining banana before serving.",
    ],
  },
  {
    id: "r4", title: "Spinach Feta Omelette", mealType: "breakfast", diet: "vegetarian",
    prep: 5, cook: 8, servings: 2, emoji: "🧀",
    ingredients: [
      { name: "Eggs", amount: 4, unit: null, category: "Dairy & Eggs" },
      { name: "Baby spinach", amount: 1.5, unit: "cup", category: "Produce" },
      { name: "Feta cheese", amount: 0.33, unit: "cup", category: "Dairy & Eggs" },
      { name: "Olive oil", amount: 1, unit: "tbsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Whisk eggs with a pinch of salt and pepper.",
      "Heat oil in a nonstick pan and wilt the spinach, about 1 minute.",
      "Pour in eggs, sprinkle feta over half, and cook until nearly set.",
      "Fold in half and cook 1 more minute before serving.",
    ],
  },
  {
    id: "r5", title: "Avocado Toast with Egg", mealType: "breakfast", diet: "vegetarian",
    prep: 5, cook: 6, servings: 2, emoji: "🥑",
    ingredients: [
      { name: "Whole grain bread", amount: 4, unit: "slice", category: "Grains & Bread" },
      { name: "Avocado", amount: 2, unit: null, category: "Produce" },
      { name: "Eggs", amount: 2, unit: null, category: "Dairy & Eggs" },
      { name: "Red pepper flakes", amount: 1, unit: "pinch", category: "Condiments & Spices" },
      { name: "Lemon", amount: 0.5, unit: null, category: "Produce" },
    ],
    steps: [
      "Toast the bread until golden.",
      "Mash avocado with a squeeze of lemon, salt, and pepper.",
      "Fry or poach the eggs to your liking.",
      "Spread avocado on toast, top with egg and red pepper flakes.",
    ],
  },
  {
    id: "r6", title: "Turkey Sausage Breakfast Bowl", mealType: "breakfast", diet: "turkey",
    prep: 8, cook: 10, servings: 2, emoji: "🍳",
    ingredients: [
      { name: "Lean turkey sausage", amount: 8, unit: "oz", category: "Protein" },
      { name: "Sweet potato", amount: 1, unit: null, category: "Produce" },
      { name: "Baby spinach", amount: 1, unit: "cup", category: "Produce" },
      { name: "Eggs", amount: 2, unit: null, category: "Dairy & Eggs" },
      { name: "Olive oil", amount: 1, unit: "tbsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Dice sweet potato small and pan-fry in olive oil until tender, 8–10 minutes.",
      "Slice turkey sausage and brown alongside the potato.",
      "Stir in spinach until wilted.",
      "Top with a fried egg and serve in bowls.",
    ],
  },
  {
    id: "r7", title: "Mediterranean Chickpea Salad", mealType: "lunch", diet: "vegetarian",
    prep: 12, cook: 0, servings: 2, emoji: "🥗",
    ingredients: [
      { name: "Chickpeas, canned", amount: 1, unit: "can", category: "Pantry & Canned" },
      { name: "Cucumber", amount: 1, unit: null, category: "Produce" },
      { name: "Cherry tomatoes", amount: 1, unit: "cup", category: "Produce" },
      { name: "Feta cheese", amount: 0.5, unit: "cup", category: "Dairy & Eggs" },
      { name: "Red onion", amount: 0.25, unit: null, category: "Produce" },
      { name: "Olive oil", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Lemon", amount: 1, unit: null, category: "Produce" },
    ],
    steps: [
      "Drain and rinse chickpeas.",
      "Dice cucumber, halve tomatoes, and thinly slice red onion.",
      "Toss everything with olive oil and a squeeze of lemon juice.",
      "Top with crumbled feta and serve chilled.",
    ],
  },
  {
    id: "r8", title: "Grilled Chicken Caesar Salad", mealType: "lunch", diet: "chicken",
    prep: 10, cook: 12, servings: 2, emoji: "🥗",
    ingredients: [
      { name: "Chicken breast", amount: 12, unit: "oz", category: "Protein" },
      { name: "Romaine lettuce", amount: 1, unit: "head", category: "Produce" },
      { name: "Parmesan cheese", amount: 0.33, unit: "cup", category: "Dairy & Eggs" },
      { name: "Whole grain croutons", amount: 1, unit: "cup", category: "Grains & Bread" },
      { name: "Light Caesar dressing", amount: 3, unit: "tbsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Season chicken breast and grill or pan-sear 5–6 minutes per side.",
      "Rest, then slice.",
      "Chop romaine and toss with dressing.",
      "Top with sliced chicken, parmesan, and croutons.",
    ],
  },
  {
    id: "r9", title: "Quinoa Black Bean Bowl", mealType: "lunch", diet: "vegetarian",
    prep: 10, cook: 15, servings: 2, emoji: "🍲",
    ingredients: [
      { name: "Quinoa", amount: 1, unit: "cup", category: "Grains & Bread" },
      { name: "Black beans, canned", amount: 1, unit: "can", category: "Pantry & Canned" },
      { name: "Corn kernels", amount: 1, unit: "cup", category: "Produce" },
      { name: "Avocado", amount: 1, unit: null, category: "Produce" },
      { name: "Lime", amount: 1, unit: null, category: "Produce" },
      { name: "Cumin", amount: 1, unit: "tsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Cook quinoa according to package directions.",
      "Warm black beans and corn with cumin in a small pan.",
      "Fluff quinoa and divide into bowls.",
      "Top with beans, corn, sliced avocado, and a squeeze of lime.",
    ],
  },
  {
    id: "r10", title: "Turkey & Avocado Wrap", mealType: "lunch", diet: "turkey",
    prep: 8, cook: 0, servings: 2, emoji: "🌯",
    ingredients: [
      { name: "Whole wheat tortillas", amount: 2, unit: null, category: "Grains & Bread" },
      { name: "Sliced turkey breast", amount: 6, unit: "oz", category: "Protein" },
      { name: "Avocado", amount: 1, unit: null, category: "Produce" },
      { name: "Baby spinach", amount: 1, unit: "cup", category: "Produce" },
      { name: "Tomato", amount: 1, unit: null, category: "Produce" },
      { name: "Greek yogurt", amount: 2, unit: "tbsp", category: "Dairy & Eggs" },
    ],
    steps: [
      "Mash avocado with a little Greek yogurt and spread on tortillas.",
      "Layer turkey, spinach, and sliced tomato.",
      "Season with salt and pepper.",
      "Roll tightly and slice in half.",
    ],
  },
  {
    id: "r11", title: "Caprese Sandwich", mealType: "lunch", diet: "vegetarian",
    prep: 8, cook: 0, servings: 2, emoji: "🥪",
    ingredients: [
      { name: "Whole grain bread", amount: 4, unit: "slice", category: "Grains & Bread" },
      { name: "Fresh mozzarella", amount: 6, unit: "oz", category: "Dairy & Eggs" },
      { name: "Tomato", amount: 2, unit: null, category: "Produce" },
      { name: "Fresh basil", amount: 0.5, unit: "cup", category: "Produce" },
      { name: "Balsamic glaze", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Slice mozzarella and tomato.",
      "Layer onto bread with basil leaves.",
      "Drizzle with balsamic glaze.",
      "Close sandwiches and slice in half.",
    ],
  },
  {
    id: "r12", title: "Lemon Herb Shrimp Salad", mealType: "lunch", diet: "fish",
    prep: 10, cook: 6, servings: 2, emoji: "🍤",
    ingredients: [
      { name: "Shrimp, peeled", amount: 12, unit: "oz", category: "Protein" },
      { name: "Mixed greens", amount: 4, unit: "cup", category: "Produce" },
      { name: "Cucumber", amount: 1, unit: null, category: "Produce" },
      { name: "Lemon", amount: 1, unit: null, category: "Produce" },
      { name: "Olive oil", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Dried oregano", amount: 1, unit: "tsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Season shrimp with oregano, salt, and pepper.",
      "Sear shrimp in olive oil 2–3 minutes per side until pink.",
      "Toss greens and sliced cucumber with lemon juice and remaining oil.",
      "Top salad with warm shrimp and serve.",
    ],
  },
  {
    id: "r13", title: "Veggie Buddha Bowl", mealType: "lunch", diet: "vegetarian",
    prep: 15, cook: 20, servings: 2, emoji: "🥙",
    ingredients: [
      { name: "Sweet potato", amount: 1, unit: null, category: "Produce" },
      { name: "Chickpeas, canned", amount: 1, unit: "can", category: "Pantry & Canned" },
      { name: "Quinoa", amount: 0.75, unit: "cup", category: "Grains & Bread" },
      { name: "Kale", amount: 2, unit: "cup", category: "Produce" },
      { name: "Tahini", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Lemon", amount: 1, unit: null, category: "Produce" },
    ],
    steps: [
      "Roast diced sweet potato and drained chickpeas at 425°F for 20 minutes.",
      "Cook quinoa according to package directions.",
      "Massage kale with a little olive oil and lemon juice.",
      "Assemble bowls and drizzle with tahini thinned with lemon juice.",
    ],
  },
  {
    id: "r14", title: "Chicken Lettuce Wraps", mealType: "lunch", diet: "chicken",
    prep: 12, cook: 10, servings: 2, emoji: "🥬",
    ingredients: [
      { name: "Ground chicken breast", amount: 12, unit: "oz", category: "Protein" },
      { name: "Butter lettuce", amount: 1, unit: "head", category: "Produce" },
      { name: "Carrot", amount: 1, unit: null, category: "Produce" },
      { name: "Green onion", amount: 2, unit: null, category: "Produce" },
      { name: "Low-sodium soy sauce", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Garlic", amount: 2, unit: "clove", category: "Produce" },
    ],
    steps: [
      "Sauté minced garlic, then brown ground chicken, about 6–8 minutes.",
      "Stir in grated carrot, chopped green onion, and soy sauce.",
      "Cook 2 more minutes until vegetables soften slightly.",
      "Spoon into lettuce leaves to serve.",
    ],
  },
  {
    id: "r15", title: "Lentil Soup", mealType: "lunch", diet: "vegetarian",
    prep: 10, cook: 30, servings: 3, emoji: "🍜",
    ingredients: [
      { name: "Green lentils", amount: 1.5, unit: "cup", category: "Pantry & Canned" },
      { name: "Carrot", amount: 2, unit: null, category: "Produce" },
      { name: "Celery", amount: 2, unit: "stalk", category: "Produce" },
      { name: "Yellow onion", amount: 1, unit: null, category: "Produce" },
      { name: "Vegetable broth", amount: 4, unit: "cup", category: "Pantry & Canned" },
      { name: "Cumin", amount: 1, unit: "tsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Dice carrot, celery, and onion; sauté until softened, about 5 minutes.",
      "Add lentils, broth, and cumin.",
      "Simmer 25–30 minutes until lentils are tender.",
      "Season with salt and pepper before serving.",
    ],
  },
  {
    id: "r16", title: "Tuna Salad Stuffed Avocado", mealType: "lunch", diet: "fish",
    prep: 8, cook: 0, servings: 2, emoji: "🥑",
    ingredients: [
      { name: "Canned tuna in water", amount: 2, unit: "can", category: "Pantry & Canned" },
      { name: "Avocado", amount: 2, unit: null, category: "Produce" },
      { name: "Celery", amount: 1, unit: "stalk", category: "Produce" },
      { name: "Greek yogurt", amount: 3, unit: "tbsp", category: "Dairy & Eggs" },
      { name: "Lemon", amount: 0.5, unit: null, category: "Produce" },
    ],
    steps: [
      "Drain tuna and mix with diced celery, yogurt, and a squeeze of lemon.",
      "Halve avocados and remove pits, scooping out a little flesh to widen the well.",
      "Season tuna salad with salt and pepper.",
      "Spoon tuna salad into avocado halves and serve.",
    ],
  },
  {
    id: "r17", title: "Baked Salmon with Asparagus", mealType: "dinner", diet: "fish",
    prep: 8, cook: 15, servings: 2, emoji: "🐟",
    ingredients: [
      { name: "Salmon fillets", amount: 12, unit: "oz", category: "Protein" },
      { name: "Asparagus", amount: 1, unit: "bunch", category: "Produce" },
      { name: "Lemon", amount: 1, unit: null, category: "Produce" },
      { name: "Olive oil", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Garlic", amount: 2, unit: "clove", category: "Produce" },
    ],
    steps: [
      "Preheat oven to 400°F.",
      "Arrange salmon and asparagus on a sheet pan, drizzle with oil, garlic, and lemon slices.",
      "Bake 12–15 minutes until salmon flakes easily.",
      "Serve with extra lemon wedges.",
    ],
  },
  {
    id: "r18", title: "Vegetable Stir-Fry with Tofu", mealType: "dinner", diet: "vegetarian",
    prep: 12, cook: 12, servings: 2, emoji: "🥦",
    ingredients: [
      { name: "Firm tofu", amount: 14, unit: "oz", category: "Protein" },
      { name: "Broccoli florets", amount: 2, unit: "cup", category: "Produce" },
      { name: "Bell pepper", amount: 1, unit: null, category: "Produce" },
      { name: "Carrot", amount: 1, unit: null, category: "Produce" },
      { name: "Low-sodium soy sauce", amount: 3, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Brown rice", amount: 1, unit: "cup", category: "Grains & Bread" },
    ],
    steps: [
      "Cook rice according to package directions.",
      "Press and cube tofu, then pan-fry until golden on most sides.",
      "Add vegetables to the pan and stir-fry 5–6 minutes until crisp-tender.",
      "Stir in soy sauce and serve over rice.",
    ],
  },
  {
    id: "r19", title: "Grilled Chicken with Roasted Veggies", mealType: "dinner", diet: "chicken",
    prep: 10, cook: 25, servings: 2, emoji: "🍗",
    ingredients: [
      { name: "Chicken breast", amount: 14, unit: "oz", category: "Protein" },
      { name: "Zucchini", amount: 1, unit: null, category: "Produce" },
      { name: "Bell pepper", amount: 2, unit: null, category: "Produce" },
      { name: "Red onion", amount: 1, unit: null, category: "Produce" },
      { name: "Olive oil", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Italian seasoning", amount: 1, unit: "tsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Preheat oven to 425°F.",
      "Toss chopped vegetables with half the oil and seasoning; roast 20 minutes.",
      "Season chicken and grill or pan-sear 6 minutes per side.",
      "Rest chicken 5 minutes, slice, and serve with roasted vegetables.",
    ],
  },
  {
    id: "r20", title: "Zucchini Noodle Primavera", mealType: "dinner", diet: "vegetarian",
    prep: 12, cook: 10, servings: 2, emoji: "🍝",
    ingredients: [
      { name: "Zucchini", amount: 3, unit: null, category: "Produce" },
      { name: "Cherry tomatoes", amount: 1.5, unit: "cup", category: "Produce" },
      { name: "Parmesan cheese", amount: 0.33, unit: "cup", category: "Dairy & Eggs" },
      { name: "Garlic", amount: 2, unit: "clove", category: "Produce" },
      { name: "Olive oil", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Fresh basil", amount: 0.25, unit: "cup", category: "Produce" },
    ],
    steps: [
      "Spiralize zucchini into noodles.",
      "Sauté garlic in olive oil, then add cherry tomatoes for 3–4 minutes.",
      "Add zucchini noodles and toss 2–3 minutes until just tender.",
      "Top with parmesan and torn basil.",
    ],
  },
  {
    id: "r21", title: "Turkey Chili", mealType: "dinner", diet: "turkey",
    prep: 10, cook: 30, servings: 4, emoji: "🌶️",
    ingredients: [
      { name: "Ground turkey breast", amount: 1, unit: "lb", category: "Protein" },
      { name: "Kidney beans, canned", amount: 1, unit: "can", category: "Pantry & Canned" },
      { name: "Diced tomatoes, canned", amount: 1, unit: "can", category: "Pantry & Canned" },
      { name: "Yellow onion", amount: 1, unit: null, category: "Produce" },
      { name: "Chili powder", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Bell pepper", amount: 1, unit: null, category: "Produce" },
    ],
    steps: [
      "Sauté diced onion and pepper until softened.",
      "Add ground turkey and cook until browned, breaking it up as it cooks.",
      "Stir in beans, tomatoes, and chili powder.",
      "Simmer 20–25 minutes, stirring occasionally.",
    ],
  },
  {
    id: "r22", title: "Eggplant Parmesan", mealType: "dinner", diet: "vegetarian",
    prep: 15, cook: 30, servings: 3, emoji: "🍆",
    ingredients: [
      { name: "Eggplant", amount: 1, unit: "large", category: "Produce" },
      { name: "Marinara sauce", amount: 2, unit: "cup", category: "Pantry & Canned" },
      { name: "Mozzarella cheese", amount: 1, unit: "cup", category: "Dairy & Eggs" },
      { name: "Parmesan cheese", amount: 0.33, unit: "cup", category: "Dairy & Eggs" },
      { name: "Whole wheat breadcrumbs", amount: 0.75, unit: "cup", category: "Grains & Bread" },
      { name: "Eggs", amount: 1, unit: null, category: "Dairy & Eggs" },
    ],
    steps: [
      "Preheat oven to 400°F. Slice eggplant into rounds.",
      "Dip slices in beaten egg, then breadcrumbs, and arrange on a baking sheet.",
      "Bake 15 minutes, flipping halfway.",
      "Layer with marinara and cheeses, then bake 10 more minutes until bubbly.",
    ],
  },
  {
    id: "r23", title: "Lemon Garlic Shrimp Pasta", mealType: "dinner", diet: "fish",
    prep: 10, cook: 12, servings: 2, emoji: "🍋",
    ingredients: [
      { name: "Shrimp, peeled", amount: 14, unit: "oz", category: "Protein" },
      { name: "Whole wheat spaghetti", amount: 8, unit: "oz", category: "Grains & Bread" },
      { name: "Garlic", amount: 3, unit: "clove", category: "Produce" },
      { name: "Lemon", amount: 1, unit: null, category: "Produce" },
      { name: "Olive oil", amount: 3, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Fresh parsley", amount: 0.25, unit: "cup", category: "Produce" },
    ],
    steps: [
      "Cook pasta according to package directions; reserve a splash of pasta water.",
      "Sauté garlic in olive oil, then add shrimp and cook until pink, 3–4 minutes.",
      "Toss shrimp with pasta, lemon juice, and reserved water.",
      "Finish with chopped parsley and black pepper.",
    ],
  },
  {
    id: "r24", title: "Stuffed Bell Peppers", mealType: "dinner", diet: "vegetarian",
    prep: 15, cook: 35, servings: 3, emoji: "🫑",
    ingredients: [
      { name: "Bell peppers", amount: 4, unit: null, category: "Produce" },
      { name: "Cooked brown rice", amount: 2, unit: "cup", category: "Grains & Bread" },
      { name: "Black beans, canned", amount: 1, unit: "can", category: "Pantry & Canned" },
      { name: "Corn kernels", amount: 1, unit: "cup", category: "Produce" },
      { name: "Shredded cheese", amount: 0.75, unit: "cup", category: "Dairy & Eggs" },
      { name: "Cumin", amount: 1, unit: "tsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Preheat oven to 375°F. Halve peppers and remove seeds.",
      "Mix rice, beans, corn, and cumin; spoon into pepper halves.",
      "Arrange in a baking dish, cover, and bake 25 minutes.",
      "Top with cheese and bake uncovered 10 more minutes.",
    ],
  },
  {
    id: "r25", title: "Chicken Fajita Bowl", mealType: "dinner", diet: "chicken",
    prep: 10, cook: 15, servings: 2, emoji: "🌮",
    ingredients: [
      { name: "Chicken breast", amount: 14, unit: "oz", category: "Protein" },
      { name: "Bell pepper", amount: 2, unit: null, category: "Produce" },
      { name: "Yellow onion", amount: 1, unit: null, category: "Produce" },
      { name: "Brown rice", amount: 1, unit: "cup", category: "Grains & Bread" },
      { name: "Fajita seasoning", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Lime", amount: 1, unit: null, category: "Produce" },
    ],
    steps: [
      "Cook rice according to package directions.",
      "Slice chicken and vegetables into strips.",
      "Sear chicken and vegetables with fajita seasoning over high heat, 8–10 minutes.",
      "Serve over rice with a squeeze of lime.",
    ],
  },
  {
    id: "r26", title: "Vegetable Curry with Chickpeas", mealType: "dinner", diet: "vegetarian",
    prep: 12, cook: 20, servings: 3, emoji: "🍛",
    ingredients: [
      { name: "Chickpeas, canned", amount: 2, unit: "can", category: "Pantry & Canned" },
      { name: "Coconut milk, light", amount: 1, unit: "can", category: "Pantry & Canned" },
      { name: "Cauliflower florets", amount: 3, unit: "cup", category: "Produce" },
      { name: "Yellow onion", amount: 1, unit: null, category: "Produce" },
      { name: "Curry powder", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Brown rice", amount: 1, unit: "cup", category: "Grains & Bread" },
    ],
    steps: [
      "Cook rice according to package directions.",
      "Sauté diced onion until soft, then stir in curry powder for 1 minute.",
      "Add cauliflower, chickpeas, and coconut milk; simmer 15 minutes.",
      "Serve over rice.",
    ],
  },
  {
    id: "r27", title: "Baked Cod with Quinoa", mealType: "dinner", diet: "fish",
    prep: 8, cook: 18, servings: 2, emoji: "🐟",
    ingredients: [
      { name: "Cod fillets", amount: 12, unit: "oz", category: "Protein" },
      { name: "Quinoa", amount: 1, unit: "cup", category: "Grains & Bread" },
      { name: "Cherry tomatoes", amount: 1, unit: "cup", category: "Produce" },
      { name: "Lemon", amount: 1, unit: null, category: "Produce" },
      { name: "Olive oil", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Fresh dill", amount: 2, unit: "tbsp", category: "Produce" },
    ],
    steps: [
      "Preheat oven to 400°F. Cook quinoa according to package directions.",
      "Place cod and tomatoes on a sheet pan, drizzle with oil and lemon.",
      "Bake 15–18 minutes until fish flakes easily.",
      "Serve over quinoa, topped with fresh dill.",
    ],
  },
  {
    id: "r28", title: "Portobello Mushroom Steaks", mealType: "dinner", diet: "vegetarian",
    prep: 10, cook: 15, servings: 2, emoji: "🍄",
    ingredients: [
      { name: "Portobello mushrooms", amount: 4, unit: "large", category: "Produce" },
      { name: "Balsamic vinegar", amount: 3, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Garlic", amount: 2, unit: "clove", category: "Produce" },
      { name: "Olive oil", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Quinoa", amount: 1, unit: "cup", category: "Grains & Bread" },
      { name: "Baby spinach", amount: 2, unit: "cup", category: "Produce" },
    ],
    steps: [
      "Cook quinoa according to package directions.",
      "Marinate mushrooms in balsamic, garlic, and oil for 10 minutes.",
      "Grill or pan-sear mushrooms 5–6 minutes per side.",
      "Serve sliced over quinoa and wilted spinach.",
    ],
  },
  {
    id: "r29", title: "Turkey Meatballs with Zoodles", mealType: "dinner", diet: "turkey",
    prep: 15, cook: 20, servings: 3, emoji: "🍝",
    ingredients: [
      { name: "Ground turkey breast", amount: 1, unit: "lb", category: "Protein" },
      { name: "Zucchini", amount: 3, unit: null, category: "Produce" },
      { name: "Marinara sauce", amount: 2, unit: "cup", category: "Pantry & Canned" },
      { name: "Whole wheat breadcrumbs", amount: 0.33, unit: "cup", category: "Grains & Bread" },
      { name: "Eggs", amount: 1, unit: null, category: "Dairy & Eggs" },
      { name: "Parmesan cheese", amount: 0.25, unit: "cup", category: "Dairy & Eggs" },
    ],
    steps: [
      "Mix turkey, breadcrumbs, egg, and parmesan; form into meatballs.",
      "Bake at 400°F for 15–18 minutes, or brown in a pan then simmer in marinara.",
      "Spiralize zucchini into noodles.",
      "Warm marinara, toss zoodles briefly in the sauce, and top with meatballs.",
    ],
  },
  {
    id: "r30", title: "Roasted Vegetable Bowl with Chicken", mealType: "dinner", diet: "chicken",
    prep: 12, cook: 25, servings: 2, emoji: "🍗",
    ingredients: [
      { name: "Chicken breast", amount: 14, unit: "oz", category: "Protein" },
      { name: "Sweet potato", amount: 1, unit: null, category: "Produce" },
      { name: "Broccoli florets", amount: 2, unit: "cup", category: "Produce" },
      { name: "Brown rice", amount: 1, unit: "cup", category: "Grains & Bread" },
      { name: "Olive oil", amount: 2, unit: "tbsp", category: "Condiments & Spices" },
      { name: "Paprika", amount: 1, unit: "tsp", category: "Condiments & Spices" },
    ],
    steps: [
      "Preheat oven to 425°F. Cook rice according to package directions.",
      "Toss cubed sweet potato and broccoli with oil and paprika; roast 20 minutes.",
      "Season and grill or pan-sear chicken 6 minutes per side; slice.",
      "Assemble bowls with rice, roasted vegetables, and chicken.",
    ],
  },
];

const unitLabel = (amount, unit) => {
  if (!unit) return `${trimNum(amount)}`;
  const plural = amount !== 1 && !["oz", "lb"].includes(unit);
  const map = {
    cup: "cup", tbsp: "tbsp", tsp: "tsp", can: "can", clove: "clove",
    stalk: "stalk", slice: "slice", bunch: "bunch", head: "head",
    pinch: "pinch", large: "large", oz: "oz", lb: "lb",
  };
  const base = map[unit] || unit;
  return `${trimNum(amount)} ${plural ? base + (base.endsWith("h") ? "es" : "s") : base}`;
};
const trimNum = (n) => (Number.isInteger(n) ? n : Math.round(n * 100) / 100);
const scaleAmount = (amount, baseServings, targetServings) =>
  (amount / baseServings) * targetServings;

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                    */
/* ------------------------------------------------------------------ */

const STORAGE_KEYS = {
  prefs: "mealplan:preferences",
  plan: "mealplan:plan",
  favorites: "mealplan:favorites",
  grocery: "mealplan:grocery",
};

async function loadJSON(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    if (!res || res.value == null) return fallback;
    return JSON.parse(res.value);
  } catch {
    return fallback;
  }
}
async function saveJSON(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch {
    /* best-effort persistence for prototype */
  }
}

/* ------------------------------------------------------------------ */
/*  Plan generation                                                    */
/* ------------------------------------------------------------------ */

function recipesForDiet(mealType, dietPref) {
  const pool = RECIPES.filter((r) => r.mealType === mealType);
  if (dietPref === "vegetarian") return pool.filter((r) => r.diet === "vegetarian");
  return pool; // "mixed" — vegetarian + lean meats, matching the curated ratio
}

function generatePlan(prefs) {
  const entries = {};
  const usedRecently = [];
  DAYS.forEach((day) => {
    entries[day] = {};
    prefs.mealTypes.forEach((mealType) => {
      const pool = recipesForDiet(mealType, prefs.diet);
      const fresh = pool.filter((r) => !usedRecently.includes(r.id));
      const choices = fresh.length ? fresh : pool;
      const pick = choices[Math.floor(Math.random() * choices.length)];
      if (pick) {
        entries[day][mealType] = pick.id;
        usedRecently.push(pick.id);
        if (usedRecently.length > 6) usedRecently.shift();
      }
    });
  });
  return { entries };
}

function swapMeal(plan, day, mealType, dietPref) {
  const pool = recipesForDiet(mealType, dietPref);
  const currentId = plan.entries[day][mealType];
  const others = pool.filter((r) => r.id !== currentId);
  const choices = others.length ? others : pool;
  const pick = choices[Math.floor(Math.random() * choices.length)];
  const next = { ...plan, entries: { ...plan.entries, [day]: { ...plan.entries[day], [mealType]: pick.id } } };
  return next;
}

function groceryItemsFromPlan(plan, servings) {
  const map = new Map();
  DAYS.forEach((day) => {
    Object.entries(plan.entries[day] || {}).forEach(([mealType, recipeId]) => {
      const recipe = RECIPES.find((r) => r.id === recipeId);
      if (!recipe) return;
      recipe.ingredients.forEach((ing) => {
        const key = `${ing.name}__${ing.unit || "unit"}`;
        const scaled = ing.unit ? scaleAmount(ing.amount, recipe.servings, servings) : scaleAmount(ing.amount, recipe.servings, servings);
        if (map.has(key)) {
          const existing = map.get(key);
          existing.amount += scaled;
        } else {
          map.set(key, { name: ing.name, unit: ing.unit, amount: scaled, category: ing.category });
        }
      });
    });
  });
  const byCategory = {};
  CATEGORY_ORDER.forEach((c) => (byCategory[c] = []));
  Array.from(map.values()).forEach((item) => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });
  Object.values(byCategory).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
  return byCategory;
}

/* ------------------------------------------------------------------ */
/*  Small UI primitives                                                */
/* ------------------------------------------------------------------ */

const DietTag = ({ diet }) => {
  const meta = DIET_META[diet];
  return (
    <span
      className="mp-sans"
      style={{
        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
        color: meta.color, background: meta.bg, letterSpacing: 0.2,
      }}
    >
      {meta.label}
    </span>
  );
};

const RecipeCard = ({ recipe, onClick, right }) => (
  <button
    onClick={onClick}
    className="mp-sans"
    style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
      background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16,
      padding: 12, cursor: "pointer",
    }}
  >
    <div
      style={{
        width: 52, height: 52, borderRadius: 12, background: COLORS.sageLight,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0,
      }}
    >
      {recipe.emoji}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.ink, marginBottom: 4 }}>
        {recipe.title}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <DietTag diet={recipe.diet} />
        <span style={{ fontSize: 12, color: COLORS.inkSoft, display: "flex", alignItems: "center", gap: 3 }}>
          <Clock size={12} /> {recipe.prep + recipe.cook}m
        </span>
      </div>
    </div>
    {right}
  </button>
);

/* ------------------------------------------------------------------ */
/*  Screens                                                             */
/* ------------------------------------------------------------------ */

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [household, setHousehold] = useState(2);
  const [diet, setDiet] = useState("mixed");
  const [mealTypes, setMealTypes] = useState(["breakfast", "lunch", "dinner"]);

  const toggleMeal = (m) =>
    setMealTypes((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));

  const steps = [
    {
      title: "How many people are you cooking for?",
      body: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 32 }}>
          <button onClick={() => setHousehold((h) => Math.max(1, h - 1))} style={circleBtnStyle}>
            <Minus size={18} color={COLORS.forest} />
          </button>
          <div style={{ textAlign: "center" }}>
            <div className="mp-serif" style={{ fontSize: 44, fontWeight: 600, color: COLORS.forest }}>{household}</div>
            <div className="mp-sans" style={{ fontSize: 12, color: COLORS.inkSoft }}>
              {household === 1 ? "person" : "people"}
            </div>
          </div>
          <button onClick={() => setHousehold((h) => Math.min(8, h + 1))} style={circleBtnStyle}>
            <Plus size={18} color={COLORS.forest} />
          </button>
        </div>
      ),
      canNext: true,
    },
    {
      title: "What should your meals include?",
      body: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          {[
            { id: "vegetarian", label: "Vegetarian only", sub: "Plant-based recipes only" },
            { id: "mixed", label: "Vegetarian + lean protein", sub: "Mostly veg, with chicken, turkey & fish — no pork" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDiet(opt.id)}
              className="mp-sans"
              style={{
                textAlign: "left", padding: 14, borderRadius: 14, cursor: "pointer",
                border: `2px solid ${diet === opt.id ? COLORS.forest : COLORS.line}`,
                background: diet === opt.id ? COLORS.sageLight : COLORS.card,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.ink }}>{opt.label}</div>
              <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 2 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      ),
      canNext: true,
    },
    {
      title: "Which meals do you want planned?",
      body: (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          {Object.entries(MEAL_LABELS).map(([id, label]) => (
            <button
              key={id}
              onClick={() => toggleMeal(id)}
              className="mp-sans"
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: 14, borderRadius: 14, cursor: "pointer",
                border: `2px solid ${mealTypes.includes(id) ? COLORS.forest : COLORS.line}`,
                background: mealTypes.includes(id) ? COLORS.sageLight : COLORS.card,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.ink }}>{label}</span>
              {mealTypes.includes(id) && <Check size={18} color={COLORS.forest} />}
            </button>
          ))}
        </div>
      ),
      canNext: mealTypes.length > 0,
    },
  ];

  const current = steps[step];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "40px 24px 24px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? COLORS.forest : COLORS.line }} />
        ))}
      </div>
      <div className="mp-serif" style={{ fontSize: 15, color: COLORS.gold, fontWeight: 600, marginBottom: 6 }}>
        Let's set up your plan
      </div>
      <div className="mp-serif" style={{ fontSize: 24, fontWeight: 600, color: COLORS.forest, lineHeight: 1.25 }}>
        {current.title}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{current.body}</div>
      <button
        disabled={!current.canNext}
        onClick={() => {
          if (step < steps.length - 1) setStep(step + 1);
          else onComplete({ householdSize: household, diet, mealTypes });
        }}
        className="mp-sans"
        style={{
          marginTop: 20, padding: "15px 0", borderRadius: 14, border: "none",
          background: current.canNext ? COLORS.forest : COLORS.line,
          color: current.canNext ? "#fff" : COLORS.inkSoft,
          fontWeight: 700, fontSize: 15, cursor: current.canNext ? "pointer" : "not-allowed",
        }}
      >
        {step < steps.length - 1 ? "Continue" : "Build my week"}
      </button>
    </div>
  );
}

function PlanScreen({ plan, prefs, favorites, toggleFavorite, onOpenRecipe, onSwap, onRegenerate }) {
  const [activeDay, setActiveDay] = useState(0);
  const day = DAYS[activeDay];
  const entries = plan.entries[day] || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="mp-serif" style={{ fontSize: 13, color: COLORS.gold, fontWeight: 600 }}>This week</div>
            <div className="mp-serif" style={{ fontSize: 24, fontWeight: 600, color: COLORS.forest }}>Your meal plan</div>
          </div>
          <button
            onClick={onRegenerate}
            style={{
              width: 38, height: 38, borderRadius: 12, border: `1px solid ${COLORS.line}`,
              background: COLORS.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
            title="Regenerate week"
          >
            <RefreshCw size={16} color={COLORS.forest} />
          </button>
        </div>

        <div className="mp-scroll" style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 16, paddingBottom: 4 }}>
          {DAYS.map((d, i) => (
            <button
              key={d}
              onClick={() => setActiveDay(i)}
              className="mp-sans"
              style={{
                minWidth: 46, padding: "9px 0", borderRadius: 12, border: "none", cursor: "pointer",
                background: i === activeDay ? COLORS.forest : COLORS.card,
                color: i === activeDay ? "#fff" : COLORS.ink,
                fontWeight: 700, fontSize: 13,
                boxShadow: i === activeDay ? "none" : `inset 0 0 0 1px ${COLORS.line}`,
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="mp-scroll" style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {prefs.mealTypes.map((mealType) => {
          const recipeId = entries[mealType];
          const recipe = RECIPES.find((r) => r.id === recipeId);
          if (!recipe) return null;
          return (
            <div key={mealType}>
              <div className="mp-sans" style={{ fontSize: 11.5, fontWeight: 800, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                {MEAL_LABELS[mealType]}
              </div>
              <RecipeCard
                recipe={recipe}
                onClick={() => onOpenRecipe(recipe)}
                right={
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                    <span
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }}
                      style={{ cursor: "pointer" }}
                    >
                      <Heart size={17} color={COLORS.rust} fill={favorites.includes(recipe.id) ? COLORS.rust : "none"} />
                    </span>
                    <span
                      onClick={(e) => { e.stopPropagation(); onSwap(day, mealType); }}
                      style={{ cursor: "pointer" }}
                    >
                      <RefreshCw size={15} color={COLORS.inkSoft} />
                    </span>
                  </div>
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecipeDetail({ recipe, prefs, favorites, toggleFavorite, onClose }) {
  const [servings, setServings] = useState(prefs.householdSize);
  return (
    <div style={{ position: "absolute", inset: 0, background: COLORS.cream, display: "flex", flexDirection: "column", zIndex: 30 }}>
      <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.line}` }}>
        <button onClick={onClose} style={iconBtnStyle}><ChevronLeft size={20} color={COLORS.forest} /></button>
        <span
          onClick={() => toggleFavorite(recipe.id)}
          style={{ cursor: "pointer" }}
        >
          <Heart size={20} color={COLORS.rust} fill={favorites.includes(recipe.id) ? COLORS.rust : "none"} />
        </span>
      </div>
      <div className="mp-scroll" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <div style={{ fontSize: 56, textAlign: "center", marginBottom: 10 }}>{recipe.emoji}</div>
        <div className="mp-serif" style={{ fontSize: 22, fontWeight: 600, color: COLORS.forest, textAlign: "center", lineHeight: 1.25 }}>
          {recipe.title}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
          <DietTag diet={recipe.diet} />
          <span className="mp-sans" style={{ fontSize: 12, color: COLORS.inkSoft, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={13} /> {recipe.prep + recipe.cook} min
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 14 }}>
          <span className="mp-sans" style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink, display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={15} /> Servings
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setServings((s) => Math.max(1, s - 1))} style={circleBtnStyleSm}><Minus size={14} color={COLORS.forest} /></button>
            <span className="mp-serif" style={{ fontWeight: 600, fontSize: 17, minWidth: 16, textAlign: "center" }}>{servings}</span>
            <button onClick={() => setServings((s) => Math.min(10, s + 1))} style={circleBtnStyleSm}><Plus size={14} color={COLORS.forest} /></button>
          </div>
        </div>

        <div className="mp-sans" style={{ fontWeight: 800, fontSize: 13, color: COLORS.forest, marginTop: 24, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Ingredients
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recipe.ingredients.map((ing, i) => (
            <div key={i} className="mp-sans" style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "9px 0", borderBottom: `1px solid ${COLORS.line}` }}>
              <span style={{ color: COLORS.ink }}>{ing.name}</span>
              <span style={{ color: COLORS.inkSoft, fontWeight: 600 }}>{unitLabel(scaleAmount(ing.amount, recipe.servings, servings), ing.unit)}</span>
            </div>
          ))}
        </div>

        <div className="mp-sans" style={{ fontWeight: 800, fontSize: 13, color: COLORS.forest, marginTop: 24, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Steps
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {recipe.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: COLORS.forest, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {i + 1}
              </div>
              <div className="mp-sans" style={{ fontSize: 14, color: COLORS.ink, lineHeight: 1.5, paddingTop: 2 }}>{step}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}

function GroceryScreen({ plan, prefs, groceryState, setGroceryState }) {
  const grouped = useMemo(() => groceryItemsFromPlan(plan, prefs.householdSize), [plan, prefs.householdSize]);
  const [newItem, setNewItem] = useState("");

  const isChecked = (key) => !!groceryState.checked[key];
  const toggleCheck = (key) =>
    setGroceryState((s) => ({ ...s, checked: { ...s.checked, [key]: !s.checked[key] } }));

  const addManual = () => {
    const name = newItem.trim();
    if (!name) return;
    setGroceryState((s) => ({
      ...s,
      manualItems: [...s.manualItems, { id: `m-${Date.now()}`, name, category: "Pantry & Canned" }],
    }));
    setNewItem("");
  };
  const removeManual = (id) =>
    setGroceryState((s) => ({ ...s, manualItems: s.manualItems.filter((m) => m.id !== id) }));

  const totalItems =
    Object.values(grouped).reduce((n, list) => n + list.length, 0) + groceryState.manualItems.length;
  const checkedCount =
    Object.values(grouped).reduce((n, list) => n + list.filter((it) => isChecked(`${it.name}__${it.unit || "unit"}`)).length, 0) +
    groceryState.manualItems.filter((m) => isChecked(`manual__${m.id}`)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 20px 12px" }}>
        <div className="mp-serif" style={{ fontSize: 13, color: COLORS.gold, fontWeight: 600 }}>Auto-generated</div>
        <div className="mp-serif" style={{ fontSize: 24, fontWeight: 600, color: COLORS.forest }}>Grocery list</div>
        <div className="mp-sans" style={{ fontSize: 12.5, color: COLORS.inkSoft, marginTop: 4 }}>
          {checkedCount} of {totalItems} picked up
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addManual()}
            placeholder="Add an item"
            className="mp-sans"
            style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1px solid ${COLORS.line}`, fontSize: 13.5, outline: "none" }}
          />
          <button onClick={addManual} style={{ ...iconBtnStyle, background: COLORS.forest, width: 42 }}>
            <Plus size={18} color="#fff" />
          </button>
        </div>
      </div>

      <div className="mp-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 20px 20px" }}>
        {CATEGORY_ORDER.map((cat) => {
          const items = grouped[cat] || [];
          const manuals = groceryState.manualItems.filter((m) => m.category === cat);
          if (!items.length && !manuals.length) return null;
          return (
            <div key={cat} style={{ marginBottom: 18 }}>
              <div className="mp-sans" style={{ fontSize: 11.5, fontWeight: 800, color: COLORS.forestSoft, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                {cat}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((it) => {
                  const key = `${it.name}__${it.unit || "unit"}`;
                  const checked = isChecked(key);
                  return (
                    <div
                      key={key}
                      onClick={() => toggleCheck(key)}
                      className="mp-sans"
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                        background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 12, cursor: "pointer",
                      }}
                    >
                      <CheckBox checked={checked} />
                      <span style={{ flex: 1, fontSize: 14, color: checked ? COLORS.inkSoft : COLORS.ink, textDecoration: checked ? "line-through" : "none" }}>
                        {it.name}
                      </span>
                      <span style={{ fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600 }}>{unitLabel(it.amount, it.unit)}</span>
                    </div>
                  );
                })}
                {manuals.map((m) => {
                  const key = `manual__${m.id}`;
                  const checked = isChecked(key);
                  return (
                    <div
                      key={key}
                      className="mp-sans"
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                        background: COLORS.card, border: `1px dashed ${COLORS.gold}`, borderRadius: 12,
                      }}
                    >
                      <span onClick={() => toggleCheck(key)} style={{ cursor: "pointer" }}>
                        <CheckBox checked={checked} />
                      </span>
                      <span
                        onClick={() => toggleCheck(key)}
                        style={{ flex: 1, fontSize: 14, color: checked ? COLORS.inkSoft : COLORS.ink, textDecoration: checked ? "line-through" : "none", cursor: "pointer" }}
                      >
                        {m.name}
                      </span>
                      <span onClick={() => removeManual(m.id)} style={{ cursor: "pointer" }}>
                        <X size={15} color={COLORS.inkSoft} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CheckBox = ({ checked }) => (
  <div
    style={{
      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
      border: `2px solid ${checked ? COLORS.forest : COLORS.line}`,
      background: checked ? COLORS.forest : "transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}
  >
    {checked && <Check size={13} color="#fff" strokeWidth={3} />}
  </div>
);

function FavoritesScreen({ favorites, onOpenRecipe, toggleFavorite }) {
  const recipes = RECIPES.filter((r) => favorites.includes(r.id));
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 20px 12px" }}>
        <div className="mp-serif" style={{ fontSize: 13, color: COLORS.gold, fontWeight: 600 }}>Saved</div>
        <div className="mp-serif" style={{ fontSize: 24, fontWeight: 600, color: COLORS.forest }}>Favorites</div>
      </div>
      <div className="mp-scroll" style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {recipes.length === 0 ? (
          <EmptyState icon={<Heart size={26} color={COLORS.rust} />} title="No favorites yet" body="Tap the heart on any recipe to save it here." />
        ) : (
          recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => onOpenRecipe(recipe)}
              right={
                <span onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe.id); }} style={{ cursor: "pointer" }}>
                  <Heart size={18} color={COLORS.rust} fill={COLORS.rust} />
                </span>
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, body }) {
  return (
    <div style={{ textAlign: "center", marginTop: 60, padding: "0 20px" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: COLORS.rustLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        {icon}
      </div>
      <div className="mp-serif" style={{ fontSize: 17, fontWeight: 600, color: COLORS.forest, marginBottom: 6 }}>{title}</div>
      <div className="mp-sans" style={{ fontSize: 13, color: COLORS.inkSoft, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

function SettingsScreen({ prefs, setPrefs, onRegenerate }) {
  const toggleMeal = (m) =>
    setPrefs((p) => ({ ...p, mealTypes: p.mealTypes.includes(m) ? p.mealTypes.filter((x) => x !== m) : [...p.mealTypes, m] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 20px 12px" }}>
        <div className="mp-serif" style={{ fontSize: 13, color: COLORS.gold, fontWeight: 600 }}>Preferences</div>
        <div className="mp-serif" style={{ fontSize: 24, fontWeight: 600, color: COLORS.forest }}>Settings</div>
      </div>
      <div className="mp-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 20px 20px", display: "flex", flexDirection: "column", gap: 22 }}>
        <div>
          <SectionLabel>Household size</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 18, background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 14 }}>
            <button onClick={() => setPrefs((p) => ({ ...p, householdSize: Math.max(1, p.householdSize - 1) }))} style={circleBtnStyleSm}><Minus size={14} color={COLORS.forest} /></button>
            <span className="mp-serif" style={{ fontWeight: 600, fontSize: 18, minWidth: 16, textAlign: "center" }}>{prefs.householdSize}</span>
            <button onClick={() => setPrefs((p) => ({ ...p, householdSize: Math.min(8, p.householdSize + 1) }))} style={circleBtnStyleSm}><Plus size={14} color={COLORS.forest} /></button>
            <span className="mp-sans" style={{ fontSize: 13, color: COLORS.inkSoft }}>{prefs.householdSize === 1 ? "person" : "people"}</span>
          </div>
        </div>

        <div>
          <SectionLabel>Diet</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "vegetarian", label: "Vegetarian only" },
              { id: "mixed", label: "Vegetarian + lean protein" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPrefs((p) => ({ ...p, diet: opt.id }))}
                className="mp-sans"
                style={{
                  textAlign: "left", padding: 13, borderRadius: 12, cursor: "pointer",
                  border: `2px solid ${prefs.diet === opt.id ? COLORS.forest : COLORS.line}`,
                  background: prefs.diet === opt.id ? COLORS.sageLight : COLORS.card,
                  fontWeight: 700, fontSize: 14, color: COLORS.ink,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Meals to plan</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(MEAL_LABELS).map(([id, label]) => (
              <button
                key={id}
                onClick={() => toggleMeal(id)}
                className="mp-sans"
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: 13, borderRadius: 12, cursor: "pointer",
                  border: `2px solid ${prefs.mealTypes.includes(id) ? COLORS.forest : COLORS.line}`,
                  background: prefs.mealTypes.includes(id) ? COLORS.sageLight : COLORS.card,
                  fontWeight: 700, fontSize: 14, color: COLORS.ink,
                }}
              >
                {label}
                {prefs.mealTypes.includes(id) && <Check size={17} color={COLORS.forest} />}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onRegenerate}
          className="mp-sans"
          style={{
            padding: "14px 0", borderRadius: 14, border: "none", background: COLORS.forest,
            color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <RefreshCw size={16} /> Regenerate this week's plan
        </button>
      </div>
    </div>
  );
}

const SectionLabel = ({ children }) => (
  <div className="mp-sans" style={{ fontSize: 11.5, fontWeight: 800, color: COLORS.forestSoft, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const circleBtnStyle = {
  width: 40, height: 40, borderRadius: "50%", border: `1px solid ${COLORS.line}`,
  background: COLORS.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};
const circleBtnStyleSm = { ...circleBtnStyle, width: 30, height: 30 };
const iconBtnStyle = {
  width: 38, height: 38, borderRadius: 12, border: `1px solid ${COLORS.line}`,
  background: COLORS.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
};

/* ------------------------------------------------------------------ */
/*  Root app                                                            */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "grocery", label: "Grocery", icon: ShoppingCart },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function MealPlannerApp() {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [prefs, setPrefs] = useState({ householdSize: 2, diet: "mixed", mealTypes: ["breakfast", "lunch", "dinner"] });
  const [plan, setPlan] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [groceryState, setGroceryState] = useState({ checked: {}, manualItems: [] });
  const [tab, setTab] = useState("plan");
  const [openRecipe, setOpenRecipe] = useState(null);

  useEffect(() => {
    (async () => {
      const savedPrefs = await loadJSON(STORAGE_KEYS.prefs, null);
      const savedPlan = await loadJSON(STORAGE_KEYS.plan, null);
      const savedFavorites = await loadJSON(STORAGE_KEYS.favorites, []);
      const savedGrocery = await loadJSON(STORAGE_KEYS.grocery, { checked: {}, manualItems: [] });
      if (savedPrefs && savedPlan) {
        setPrefs(savedPrefs);
        setPlan(savedPlan);
        setOnboarded(true);
      }
      setFavorites(savedFavorites);
      setGroceryState(savedGrocery);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { if (onboarded) saveJSON(STORAGE_KEYS.prefs, prefs); }, [prefs, onboarded]);
  useEffect(() => { if (plan) saveJSON(STORAGE_KEYS.plan, plan); }, [plan]);
  useEffect(() => { saveJSON(STORAGE_KEYS.favorites, favorites); }, [favorites]);
  useEffect(() => { saveJSON(STORAGE_KEYS.grocery, groceryState); }, [groceryState]);

  const completeOnboarding = useCallback((newPrefs) => {
    setPrefs(newPrefs);
    setPlan(generatePlan(newPrefs));
    setGroceryState({ checked: {}, manualItems: [] });
    setOnboarded(true);
  }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites((favs) => (favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]));
  }, []);

  const handleSwap = useCallback((day, mealType) => {
    setPlan((p) => swapMeal(p, day, mealType, prefs.diet));
  }, [prefs.diet]);

  const handleRegenerate = useCallback(() => {
    setPlan(generatePlan(prefs));
    setGroceryState((s) => ({ ...s, checked: {} }));
  }, [prefs]);

  if (loading) {
    return (
      <PhoneFrame>
        <FontStyles />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <div className="mp-serif" style={{ color: COLORS.forest, fontSize: 15 }}>Loading…</div>
        </div>
      </PhoneFrame>
    );
  }

  if (!onboarded) {
    return (
      <PhoneFrame>
        <FontStyles />
        <Onboarding onComplete={completeOnboarding} />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <FontStyles />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {tab === "plan" && (
            <PlanScreen
              plan={plan}
              prefs={prefs}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              onOpenRecipe={setOpenRecipe}
              onSwap={handleSwap}
              onRegenerate={handleRegenerate}
            />
          )}
          {tab === "grocery" && (
            <GroceryScreen plan={plan} prefs={prefs} groceryState={groceryState} setGroceryState={setGroceryState} />
          )}
          {tab === "favorites" && (
            <FavoritesScreen favorites={favorites} onOpenRecipe={setOpenRecipe} toggleFavorite={toggleFavorite} />
          )}
          {tab === "settings" && (
            <SettingsScreen prefs={prefs} setPrefs={setPrefs} onRegenerate={handleRegenerate} />
          )}
          {openRecipe && (
            <RecipeDetail
              recipe={openRecipe}
              prefs={prefs}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              onClose={() => setOpenRecipe(null)}
            />
          )}
        </div>

        <div style={{ display: "flex", borderTop: `1px solid ${COLORS.line}`, background: COLORS.card, padding: "8px 8px 14px" }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="mp-sans"
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "8px 0", border: "none", background: "transparent", cursor: "pointer",
                }}
              >
                <Icon size={20} color={active ? COLORS.forest : COLORS.inkSoft} fill={active && t.id === "favorites" ? COLORS.forest : "none"} strokeWidth={active ? 2.4 : 2} />
                <span style={{ fontSize: 10.5, fontWeight: active ? 800 : 600, color: active ? COLORS.forest : COLORS.inkSoft }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </PhoneFrame>
  );
}

function PhoneFrame({ children }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#EDE8DA", padding: 24 }}>
      <div
        style={{
          width: 380, height: 780, background: COLORS.cream, borderRadius: 40, overflow: "hidden",
          position: "relative", boxShadow: "0 30px 60px rgba(34,57,44,0.25)", border: "10px solid #16241C",
        }}
      >
        {children}
      </div>
    </div>
  );
}
