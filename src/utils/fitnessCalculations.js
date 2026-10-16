export const calcBMR = ({ gender, weightKg, heightCm, age }) => {
  if (gender === "female") return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
};

export const calcTDEE = (bmr, level) => {
  const factorMap = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
    beginner: 1.35,
    intermediate: 1.5,
    advanced: 1.7
  };
  return Math.round(bmr * (factorMap[level] || 1.4));
};

export const goalAdjustedCalories = (tdee, goal) => {
  if (goal === "fat_loss") return Math.round(tdee - 400);
  if (goal === "muscle_gain") return Math.round(tdee + 300);
  return Math.round(tdee);
};

export const macroSplit = (calories, goal) => {
  const splitMap = {
    fat_loss: { protein: 0.35, carbs: 0.35, fats: 0.3 },
    muscle_gain: { protein: 0.3, carbs: 0.45, fats: 0.25 },
    maintenance: { protein: 0.3, carbs: 0.4, fats: 0.3 },
    strength: { protein: 0.3, carbs: 0.4, fats: 0.3 }
  };
  const split = splitMap[goal] || splitMap.maintenance;
  return {
    protein: Math.round((calories * split.protein) / 4),
    carbs: Math.round((calories * split.carbs) / 4),
    fats: Math.round((calories * split.fats) / 9)
  };
};

export const waterTargetFromWeight = (weightKg) => Math.round(weightKg * 35);
