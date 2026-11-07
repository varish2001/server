import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Gym User", trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      select: false
    },
    hasProfile: {
      type: Boolean,
      default: false
    },
    // Fitness Profile Fields
    age: { type: Number },
    heightCm: { type: Number },
    weightKg: { type: Number },
    gender: { type: String, enum: ["male", "female", "other"] },
    fitnessGoal: {
      type: String,
      enum: ["fat_loss", "muscle_gain", "maintenance", "strength", "endurance", "beginner_fitness"]
    },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"]
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
    workoutDaysPerWeek: { type: Number, min: 3, max: 6, default: 3 },
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
