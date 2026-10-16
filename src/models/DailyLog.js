import mongoose from "mongoose";

const dailyLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    waterIntakeMl: { type: Number, default: 0 },
    caloriesBurned: { type: Number, default: 0 },
    workoutsCompleted: { type: Number, default: 0 },
    weightKg: Number,
    notes: String
  },
  { timestamps: true }
);

dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyLog = mongoose.model("DailyLog", dailyLogSchema);
