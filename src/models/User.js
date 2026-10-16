import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Gym User" },
    age: { type: Number, required: true },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    fitnessGoal: {
      type: String,
      enum: ["fat_loss", "muscle_gain", "maintenance", "strength", "endurance", "beginner_fitness"],
      required: true
    },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true
    },
    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "active", "very_active"],
      default: "moderate"
    },
    dietPreference: {
      type: String,
      enum: ["veg", "non_veg"],
      default: "veg"
    },
    workoutDaysPerWeek: { type: Number, min: 3, max: 6 },
    equipmentPreference: {
      type: String,
      enum: ["home", "gym"],
      default: "gym"
    },
    injuriesLimitations: { type: String, default: "" },
    dailyWaterTargetMl: { type: Number, default: 2500 },
    dailyCalorieTarget: { type: Number, default: 2200 }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
