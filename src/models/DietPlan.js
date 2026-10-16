import mongoose from "mongoose";

const mealItemSchema = new mongoose.Schema(
  {
    name: String,
    quantity: String,
    portion: String,
    macros: {
      protein: Number,
      carbs: Number,
      fats: Number,
      calories: Number
    }
  },
  { _id: false }
);

const mealSlotsSchema = new mongoose.Schema(
  {
    breakfast: [mealItemSchema],
    lunch: [mealItemSchema],
    snack: [mealItemSchema],
    dinner: [mealItemSchema]
  },
  { _id: false }
);

const dietPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    calories: Number,
    goal: String,
    dietPreference: String,
    macros: {
      protein: Number,
      carbs: Number,
      fats: Number
    },
    hydration: Number,
    hydrationMl: Number,
    meals: mealSlotsSchema
  },
  { timestamps: true }
);

export const DietPlan = mongoose.model("DietPlan", dietPlanSchema);
