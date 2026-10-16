import mongoose from "mongoose";

const workoutDaySchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    focus: String,
    muscleGroup: String,
    exercises: [
      {
        name: String,
        sets: Number,
        reps: String,
        rest: String,
        tips: String,
        muscleTargeted: String,
        difficulty: String,
        notes: String,
        imageUrl: String
      }
    ]
  },
  { _id: false }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    goal: { type: String, required: true },
    goalKey: String,
    level: { type: String, required: true },
    split: String,
    workoutDaysPerWeek: Number,
    equipmentPreference: String,
    experienceLevel: String,
    weeklyPlan: [workoutDaySchema],
    weeklySchedule: [workoutDaySchema],
    warmUp: String,
    coolDown: String,
    progressiveOverload: String,
    recoveryTips: [String],
    restDays: [String],
    generatedAt: Date
  },
  { timestamps: true }
);

export const WorkoutPlan = mongoose.model("WorkoutPlan", workoutPlanSchema);
