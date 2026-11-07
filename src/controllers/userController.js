import jwt from "jsonwebtoken";
import mongoose from "mongoose";
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
      name: (typeof name === "string" && name.trim()) || "Gym User",
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      gender,
      fitnessGoal,
      experienceLevel,
      activityLevel: activityLevel || "moderate",
      dietPreference: dietPreference || "veg",
      workoutDaysPerWeek: workoutDaysPerWeek ? Number(workoutDaysPerWeek) : 3,
      equipmentPreference: equipmentPreference || "gym",
      injuriesLimitations: typeof injuriesLimitations === "string" ? injuriesLimitations : ""
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

    // Check if user is already authenticated (update existing profile without creating duplicates)
    let existingUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], jwtSecret);
        if (decoded?.userId) {
          existingUserId = decoded.userId;
        }
      } catch {
        // Token invalid or expired, proceed to create new user profile
      }
    }

    let user = null;
    let isUpdate = false;

    if (existingUserId) {
      user = runtimeState.dbConnected
        ? await User.findById(existingUserId)
        : memoryStore.getUserById(existingUserId);

      if (user) {
        user = runtimeState.dbConnected
          ? await User.findByIdAndUpdate(user._id, { $set: validatedPayload }, { new: true })
          : memoryStore.updateUser(user._id, validatedPayload);
        isUpdate = true;
      }
    }

    if (!user) {
      user = runtimeState.dbConnected
        ? await User.create(validatedPayload)
        : memoryStore.createUser(validatedPayload);
    }

    const { workout, diet, source } = await generatePersonalizedPlans(user);
    const workoutPlan = {
      ...workout,
      goal: user.fitnessGoal,
      level: user.experienceLevel,
      weeklySchedule: workout.weeklyPlan
    };

    if (runtimeState.dbConnected) {
      await WorkoutPlan.findOneAndUpdate(
        { userId: user._id },
        { $set: { userId: user._id, ...workoutPlan } },
        { upsert: true, new: true }
      );

      await DietPlan.findOneAndUpdate(
        { userId: user._id },
        { $set: { userId: user._id, ...diet } },
        { upsert: true, new: true }
      );
    } else {
      memoryStore.upsertWorkout(user._id, workoutPlan);
      memoryStore.upsertDiet(user._id, diet);
    }

    res.status(isUpdate ? 200 : 201).json({
      token: signToken(user._id),
      user,
      recommendationSource: source,
      updated: isUpdate
    });
  } catch (error) {
    console.error("Profile creation failed", {
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      message: error.message
    });

    // Handle Mongo duplicate key error (E11000)
    if (error.code === 11000) {
      const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : "field";
      console.warn(`[E11000 Resolution] Duplicate key detected on field '${field}':`, error.keyValue);

      // If the duplicate key is triggered by a legacy/null index on MongoDB collection
      if (runtimeState.dbConnected && mongoose.connection.db) {
        try {
          const db = mongoose.connection.db;
          const col = db.collection("users");
          const indexes = await col.indexes();
          const conflictingIndex = indexes.find(
            (idx) => idx.key && idx.key[field] !== undefined && idx.unique && idx.name !== "_id_"
          );

          if (conflictingIndex) {
            console.warn(`[E11000 Resolution] Dropping conflicting index '${conflictingIndex.name}' on 'users.${field}'`);
            await col.dropIndex(conflictingIndex.name);

            // Re-attempt creating the profile after dropping the phantom unique index
            const retriedUser = await User.create(req.body);
            const { workout, diet, source } = await generatePersonalizedPlans(retriedUser);
            const workoutPlan = {
              ...workout,
              goal: retriedUser.fitnessGoal,
              level: retriedUser.experienceLevel,
              weeklySchedule: workout.weeklyPlan
            };

            await WorkoutPlan.findOneAndUpdate(
              { userId: retriedUser._id },
              { $set: { userId: retriedUser._id, ...workoutPlan } },
              { upsert: true }
            );
            await DietPlan.findOneAndUpdate(
              { userId: retriedUser._id },
              { $set: { userId: retriedUser._id, ...diet } },
              { upsert: true }
            );

            return res.status(201).json({
              token: signToken(retriedUser._id),
              user: retriedUser,
              recommendationSource: source
            });
          }
        } catch (repairError) {
          console.error("[E11000 Resolution] Index drop retry failed:", repairError.message);
        }
      }

      return res.status(409).json({
        message: `A profile with this ${field} already exists.`,
        conflictField: field
      });
    }

    res.status(500).json({ message: "Unable to create profile" });
  }
};

export const me = async (req, res) => {
  res.json(req.user);
};
