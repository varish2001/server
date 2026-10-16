import { calcBMR, calcTDEE, goalAdjustedCalories, waterTargetFromWeight } from "../utils/fitnessCalculations.js";

const ACTIVITY_TO_EXPERIENCE = {
  sedentary: "beginner",
  light: "beginner",
  moderate: "intermediate",
  active: "advanced",
  very_active: "advanced",
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced"
};

const GOAL_LABELS = {
  fat_loss: "Fat Loss",
  muscle_gain: "Muscle Gain",
  maintenance: "Maintenance",
  strength: "Strength"
};

const mealLibrary = {
  veg: {
    breakfast: [
      {
        name: "Masala oats with roasted seeds",
        quantity: "60 g oats + 10 g mixed seeds",
        portion: "Cook in 250 ml water or milk",
        macros: { protein: 11, carbs: 34, fats: 8, calories: 250 }
      },
      {
        name: "Paneer bhurji with multigrain roti",
        quantity: "120 g paneer + 2 rotis",
        portion: "Use 2 rotis of about 35 g each",
        macros: { protein: 24, carbs: 32, fats: 16, calories: 360 }
      },
      {
        name: "Greek yogurt with banana and almonds",
        quantity: "200 g Greek yogurt + 1 banana + 15 g almonds",
        portion: "Use 1 medium banana",
        macros: { protein: 18, carbs: 28, fats: 9, calories: 260 }
      },
      {
        name: "Moong chilla with mint chutney",
        quantity: "2 chillas from 80 g moong batter",
        portion: "Add 15 g mint chutney",
        macros: { protein: 16, carbs: 24, fats: 6, calories: 210 }
      }
    ],
    lunch: [
      {
        name: "Brown rice with rajma and cucumber salad",
        quantity: "150 g cooked rice + 180 g rajma",
        portion: "Add 80 g cucumber salad",
        macros: { protein: 18, carbs: 62, fats: 7, calories: 390 }
      },
      {
        name: "Paneer tikka with rotis and sauteed vegetables",
        quantity: "150 g paneer tikka + 2 rotis",
        portion: "Add 100 g sauteed vegetables",
        macros: { protein: 29, carbs: 34, fats: 18, calories: 420 }
      },
      {
        name: "Quinoa pulao with curd",
        quantity: "180 g cooked quinoa pulao + 100 g curd",
        portion: "Use plain low-fat curd",
        macros: { protein: 15, carbs: 48, fats: 9, calories: 330 }
      },
      {
        name: "Dal khichdi with beetroot raita",
        quantity: "250 g dal khichdi + 80 g beetroot raita",
        portion: "Keep ghee to 5 g or less",
        macros: { protein: 17, carbs: 52, fats: 8, calories: 350 }
      }
    ],
    snack: [
      {
        name: "Roasted chana with buttermilk",
        quantity: "40 g roasted chana + 250 ml buttermilk",
        portion: "Choose unsweetened buttermilk",
        macros: { protein: 11, carbs: 24, fats: 3, calories: 165 }
      },
      {
        name: "Apple with peanut butter",
        quantity: "1 apple (180 g) + 16 g peanut butter",
        portion: "About 1 level tablespoon peanut butter",
        macros: { protein: 5, carbs: 25, fats: 8, calories: 185 }
      },
      {
        name: "Protein smoothie with milk and oats",
        quantity: "250 ml milk + 30 g oats + 1 scoop protein",
        portion: "Blend with ice or water as needed",
        macros: { protein: 24, carbs: 27, fats: 7, calories: 260 }
      },
      {
        name: "Sprouts chaat with lemon",
        quantity: "150 g mixed sprouts + 10 ml lemon juice",
        portion: "Add onion and tomato if desired",
        macros: { protein: 12, carbs: 20, fats: 3, calories: 155 }
      }
    ],
    dinner: [
      {
        name: "Rotis with dal tadka and stir-fried beans",
        quantity: "2 rotis + 180 g dal + 100 g beans",
        portion: "Use 2 rotis of about 35 g each",
        macros: { protein: 20, carbs: 42, fats: 9, calories: 330 }
      },
      {
        name: "Tofu curry with jeera rice",
        quantity: "140 g tofu curry + 150 g jeera rice",
        portion: "Keep oil to 10 g or less",
        macros: { protein: 22, carbs: 38, fats: 11, calories: 345 }
      },
      {
        name: "Palak paneer with millet roti",
        quantity: "180 g palak paneer + 2 millet rotis",
        portion: "Use 2 rotis of about 30 g each",
        macros: { protein: 24, carbs: 30, fats: 16, calories: 360 }
      },
      {
        name: "Vegetable soup with chickpea salad",
        quantity: "300 ml soup + 120 g chickpea salad",
        portion: "Use boiled chickpeas",
        macros: { protein: 16, carbs: 29, fats: 7, calories: 245 }
      }
    ]
  },
  non_veg: {
    breakfast: [
      {
        name: "Veg omelette with sourdough toast",
        quantity: "3 eggs + 2 toast slices",
        portion: "Use 2 slices of about 35 g each",
        macros: { protein: 23, carbs: 26, fats: 14, calories: 320 }
      },
      {
        name: "Egg bhurji with rotis",
        quantity: "3 eggs + 2 rotis",
        portion: "Use 2 rotis of about 35 g each",
        macros: { protein: 21, carbs: 29, fats: 15, calories: 335 }
      },
      {
        name: "Greek yogurt with banana and walnuts",
        quantity: "200 g Greek yogurt + 1 banana + 15 g walnuts",
        portion: "Use 1 medium banana",
        macros: { protein: 18, carbs: 27, fats: 10, calories: 265 }
      },
      {
        name: "Overnight oats with whey and berries",
        quantity: "60 g oats + 1 scoop whey + 50 g berries",
        portion: "Soak in 200 ml milk overnight",
        macros: { protein: 28, carbs: 34, fats: 7, calories: 310 }
      }
    ],
    lunch: [
      {
        name: "Brown rice with grilled chicken and salad",
        quantity: "150 g grilled chicken + 150 g cooked rice",
        portion: "Add 80 g salad",
        macros: { protein: 34, carbs: 42, fats: 8, calories: 390 }
      },
      {
        name: "Chicken curry with rotis and cucumber raita",
        quantity: "180 g chicken curry + 2 rotis",
        portion: "Add 80 g cucumber raita",
        macros: { protein: 30, carbs: 31, fats: 14, calories: 380 }
      },
      {
        name: "Fish tikka with quinoa and veggies",
        quantity: "150 g fish tikka + 150 g cooked quinoa",
        portion: "Add 100 g mixed vegetables",
        macros: { protein: 33, carbs: 30, fats: 11, calories: 350 }
      },
      {
        name: "Lean keema with jeera rice",
        quantity: "140 g lean keema + 150 g jeera rice",
        portion: "Choose lean mince",
        macros: { protein: 29, carbs: 39, fats: 12, calories: 370 }
      }
    ],
    snack: [
      {
        name: "Boiled eggs with fruit",
        quantity: "2 eggs + 1 fruit (150 to 180 g)",
        portion: "Use apple, orange, or banana",
        macros: { protein: 13, carbs: 16, fats: 10, calories: 195 }
      },
      {
        name: "Protein smoothie with milk and oats",
        quantity: "250 ml milk + 30 g oats + 1 scoop protein",
        portion: "Blend with ice or water as needed",
        macros: { protein: 24, carbs: 27, fats: 7, calories: 260 }
      },
      {
        name: "Chicken sandwich on whole wheat bread",
        quantity: "90 g chicken filling + 2 bread slices",
        portion: "Use 2 slices of about 35 g each",
        macros: { protein: 22, carbs: 28, fats: 6, calories: 245 }
      },
      {
        name: "Roasted makhana with buttermilk",
        quantity: "30 g makhana + 250 ml buttermilk",
        portion: "Choose unsweetened buttermilk",
        macros: { protein: 8, carbs: 21, fats: 4, calories: 150 }
      }
    ],
    dinner: [
      {
        name: "Grilled fish with sauteed vegetables",
        quantity: "160 g fish fillet + 150 g vegetables",
        portion: "Cook with 10 g oil or less",
        macros: { protein: 32, carbs: 12, fats: 11, calories: 270 }
      },
      {
        name: "Chicken stew with rotis and salad",
        quantity: "180 g chicken stew + 2 rotis",
        portion: "Add 80 g salad",
        macros: { protein: 29, carbs: 30, fats: 10, calories: 330 }
      },
      {
        name: "Egg curry with millet roti",
        quantity: "2 eggs + 2 millet rotis",
        portion: "Use 2 rotis of about 30 g each",
        macros: { protein: 20, carbs: 29, fats: 13, calories: 300 }
      },
      {
        name: "Lentil soup with shredded chicken salad",
        quantity: "300 ml lentil soup + 120 g chicken salad",
        portion: "Use boiled or grilled chicken",
        macros: { protein: 27, carbs: 18, fats: 8, calories: 245 }
      }
    ]
  }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundMacro = (value) => Math.max(0, Math.round(value));

const normalizeGoal = (goal) => {
  if (goal === "strength") return "maintenance";
  return ["fat_loss", "muscle_gain", "maintenance"].includes(goal) ? goal : "maintenance";
};

const normalizeDietPreference = (value) => {
  if (value === "non_veg") return "non_veg";
  return "veg";
};

const normalizeActivityLevel = (value) => {
  if (
    ["sedentary", "light", "moderate", "active", "very_active", "beginner", "intermediate", "advanced"].includes(
      value
    )
  ) {
    return value;
  }
  return "moderate";
};

export const normalizeDietProfile = (input = {}) => {
  const goal = normalizeGoal(input.goal || input.fitnessGoal);
  const activityLevel = normalizeActivityLevel(input.activityLevel || input.experienceLevel);
  const experienceLevel = ACTIVITY_TO_EXPERIENCE[activityLevel] || "intermediate";
  const weightKg = Number(input.weightKg ?? input.weight);
  const heightCm = Number(input.heightCm ?? input.height);
  const age = Number(input.age);

  return {
    name: input.name || "Gym User",
    age: Number.isFinite(age) ? age : 25,
    heightCm: Number.isFinite(heightCm) ? heightCm : 170,
    weightKg: Number.isFinite(weightKg) ? weightKg : 70,
    gender: ["male", "female", "other"].includes(input.gender) ? input.gender : "other",
    goal,
    fitnessGoal: goal,
    activityLevel,
    experienceLevel,
    dietPreference: normalizeDietPreference(input.dietPreference)
  };
};

export const calculateDietTargets = (profile) => {
  const bmr = calcBMR(profile);
  const tdee = calcTDEE(bmr, profile.activityLevel || profile.experienceLevel);
  const calories = goalAdjustedCalories(tdee, profile.goal);
  const proteinMultiplier = profile.goal === "muscle_gain" ? 2 : profile.goal === "fat_loss" ? 2.2 : 1.8;
  const protein = Math.round(profile.weightKg * proteinMultiplier);
  const fatCalories = Math.round(calories * (profile.goal === "fat_loss" ? 0.22 : 0.25));
  const fats = Math.max(35, Math.round(fatCalories / 9));
  const carbs = Math.max(90, Math.round((calories - protein * 4 - fats * 9) / 4));
  const hydration = waterTargetFromWeight(profile.weightKg) + (profile.activityLevel === "active" ? 250 : 0) + (profile.activityLevel === "very_active" ? 450 : 0);

  return {
    calories,
    hydration,
    macros: {
      protein,
      carbs,
      fats
    }
  };
};

const pickMealItems = (options, startIndex, count) => {
  const items = [];
  for (let index = 0; index < count; index += 1) {
    items.push(options[(startIndex + index) % options.length]);
  }
  return items;
};

const scaleMealItem = (item, factor) => ({
  ...item,
  quantity: item.quantity,
  portion: item.portion,
  macros: {
    protein: roundMacro(item.macros.protein * factor),
    carbs: roundMacro(item.macros.carbs * factor),
    fats: roundMacro(item.macros.fats * factor),
    calories: roundMacro(item.macros.calories * factor)
  }
});

const sizeMealItems = (items, profile, slot) => {
  const slotFactorMap = {
    breakfast: 1,
    lunch: 1.08,
    snack: profile.goal === "muscle_gain" ? 1.08 : 0.95,
    dinner: profile.goal === "fat_loss" ? 0.95 : 1
  };
  const goalFactor = profile.goal === "muscle_gain" ? 1.1 : profile.goal === "fat_loss" ? 0.92 : 1;
  const activityFactor =
    profile.activityLevel === "active" || profile.activityLevel === "very_active"
      ? 1.08
      : profile.activityLevel === "light"
        ? 0.96
        : 1;
  const factor = slotFactorMap[slot] * goalFactor * activityFactor;
  return items.map((item) => scaleMealItem(item, factor));
};

export const generateMealSlots = (profile, targets) => {
  const library = mealLibrary[profile.dietPreference];
  const offset = clamp(Math.round((targets.calories - 1600) / 250), 0, 3);

  return {
    breakfast: sizeMealItems(pickMealItems(library.breakfast, offset, 2), profile, "breakfast"),
    lunch: sizeMealItems(pickMealItems(library.lunch, offset + 1, 2), profile, "lunch"),
    snack: sizeMealItems(pickMealItems(library.snack, offset + 2, 2), profile, "snack"),
    dinner: sizeMealItems(pickMealItems(library.dinner, offset + 3, 2), profile, "dinner")
  };
};

const normalizeMealItem = (item, fallbackName = "Balanced meal item") => {
  if (typeof item === "string") {
      return {
        name: item,
        quantity: "100 g",
        portion: "Use this as one measured portion",
        macros: {
          protein: 12,
          carbs: 20,
        fats: 6,
        calories: 180
      }
    };
  }

  return {
    name: String(item?.name || fallbackName),
    quantity: String(item?.quantity || "100 g"),
    portion: String(item?.portion || "Use this as one measured portion"),
    macros: {
      protein: Number(item?.macros?.protein ?? 0),
      carbs: Number(item?.macros?.carbs ?? 0),
      fats: Number(item?.macros?.fats ?? 0),
      calories: Number(item?.macros?.calories ?? 0)
    }
  };
};

export const shapeDietPlanResponse = (plan, profile) => {
  const legacyMeals = Array.isArray(plan?.meals)
    ? plan.meals.reduce(
        (acc, meal) => {
          const key = String(meal?.title || "").trim().toLowerCase();
          if (["breakfast", "lunch", "snack", "dinner"].includes(key)) {
            acc[key] = Array.isArray(meal?.items) ? meal.items : [];
          }
          return acc;
        },
        { breakfast: [], lunch: [], snack: [], dinner: [] }
      )
    : null;
  const meals = legacyMeals || plan?.meals || {};
  const hydration = Number(plan?.hydration ?? plan?.hydrationMl ?? 0);
  const goal = normalizeGoal(plan?.goal || profile?.goal || profile?.fitnessGoal);

  return {
    calories: Number(plan?.calories ?? 0),
    hydration,
    hydrationMl: hydration,
    goal,
    goalLabel: GOAL_LABELS[goal] || "Maintenance",
    dietPreference: normalizeDietPreference(plan?.dietPreference || profile?.dietPreference),
    macros: {
      protein: Number(plan?.macros?.protein ?? 0),
      carbs: Number(plan?.macros?.carbs ?? 0),
      fats: Number(plan?.macros?.fats ?? 0)
    },
    meals: {
      breakfast: Array.isArray(meals.breakfast) ? meals.breakfast.map((item) => normalizeMealItem(item, "Breakfast option")) : [],
      lunch: Array.isArray(meals.lunch) ? meals.lunch.map((item) => normalizeMealItem(item, "Lunch option")) : [],
      snack: Array.isArray(meals.snack) ? meals.snack.map((item) => normalizeMealItem(item, "Snack option")) : [],
      dinner: Array.isArray(meals.dinner) ? meals.dinner.map((item) => normalizeMealItem(item, "Dinner option")) : []
    }
  };
};

export const buildDietPlan = (input) => {
  const profile = normalizeDietProfile(input);
  const targets = calculateDietTargets(profile);

  return shapeDietPlanResponse(
    {
      calories: targets.calories,
      hydration: targets.hydration,
      goal: profile.goal,
      dietPreference: profile.dietPreference,
      macros: targets.macros,
      meals: generateMealSlots(profile, targets)
    },
    profile
  );
};
