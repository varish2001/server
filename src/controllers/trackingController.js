import { DailyLog } from "../models/DailyLog.js";
import { runtimeState } from "../config/runtime.js";
import { memoryStore } from "../store/memoryStore.js";

const today = () => new Date().toISOString().slice(0, 10);

export const upsertTodayLog = async (req, res) => {
  const { waterIntakeMl, caloriesBurned, workoutsCompleted, weightKg, notes } = req.body;
  const log = runtimeState.dbConnected
    ? await DailyLog.findOneAndUpdate(
        { userId: req.user._id, date: today() },
        {
          $set: {
            waterIntakeMl,
            caloriesBurned,
            workoutsCompleted,
            weightKg,
            notes
          }
        },
        { upsert: true, new: true }
      )
    : memoryStore.upsertLog(req.user._id, today(), {
        waterIntakeMl,
        caloriesBurned,
        workoutsCompleted,
        weightKg,
        notes
      });
  res.json(log);
};

export const addWater = async (req, res) => {
  const { amountMl } = req.body;
  const log = runtimeState.dbConnected
    ? await DailyLog.findOneAndUpdate(
        { userId: req.user._id, date: today() },
        { $inc: { waterIntakeMl: amountMl || 250 } },
        { upsert: true, new: true }
      )
    : memoryStore.addWater(req.user._id, today(), amountMl || 250);
  res.json(log);
};

export const getLogs = async (req, res) => {
  const logs = runtimeState.dbConnected
    ? await DailyLog.find({ userId: req.user._id }).sort({ date: 1 }).limit(90)
    : memoryStore.getLogs(req.user._id);
  res.json(logs);
};
