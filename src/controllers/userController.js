import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { WorkoutPlan } from "../models/WorkoutPlan.js";
import { DietPlan } from "../models/DietPlan.js";
import { generatePersonalizedPlans } from "../services/recommendationService.js";
import { runtimeState } from "../config/runtime.js";
import { memoryStore } from "../store/memoryStore.js";

const jwtSecret = process.env.JWT_SECRET || "dev_jwt_secret_change_me";

const signToken = (userId) =>
  jwt.sign({ userId }, jwtSecret, {
    expiresIn: "30d"
  });

export const getStarted = async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ message: "Invalid profile data", errors: { body: "A JSON object is required" } });
  }

  try {
    const {
      age,
      heightCm,
      weightKg,
      gender,
      fitnessGoal,
      experienceLevel,
      activityLevel,
      dietPreference,
      name,
      workoutDaysPerWeek,
      equipmentPreference,
      injuriesLimitations
    } = req.body;
    const payload = {
      name,
      age,
      heightCm,
      weightKg,
      gender,
      fitnessGoal,
      experienceLevel,
      activityLevel,
      dietPreference,
      workoutDaysPerWeek,
      equipmentPreference,
      injuriesLimitations
    };
    const profile = new User(payload);
    const validationError = profile.validateSync();
    if (validationError) {
      const errors = Object.fromEntries(
        Object.keys(validationError.errors).map((field) => [field, "Invalid or missing value"])
      );
      return res.status(400).json({ message: "Invalid profile data", errors });
    }

    const { _id, createdAt, updatedAt, ...validatedPayload } = profile.toObject({ versionKey: false });
    const user = runtimeState.dbConnected
      ? await User.create(validatedPayload)
      : memoryStore.createUser(validatedPayload);

    const { workout, diet, source } = await generatePersonalizedPlans(user);
    const workoutPlan = {
      ...workout,
      goal: user.fitnessGoal,
      level: user.experienceLevel,
      weeklySchedule: workout.weeklyPlan
    };

    if (runtimeState.dbConnected) {
      await WorkoutPlan.create({
        userId: user._id,
        ...workoutPlan
      });

      await DietPlan.create({
        userId: user._id,
        ...diet
      });
    } else {
      memoryStore.upsertWorkout(user._id, workoutPlan);
      memoryStore.upsertDiet(user._id, diet);
    }

    res.status(201).json({
      token: signToken(user._id),
      user,
      recommendationSource: source
    });
  } catch (error) {
    console.error("Profile creation failed", {
      name: error.name,
      code: typeof error.code === "string" || typeof error.code === "number" ? error.code : undefined
    });
    res.status(500).json({ message: "Unable to create profile" });
  }
};

export const me = async (req, res) => {
  res.json(req.user);
};
