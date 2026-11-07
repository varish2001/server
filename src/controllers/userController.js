import bcrypt from "bcryptjs";
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

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const raw = typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };
  delete raw.password;
  delete raw.__v;
  return raw;
};

export const register = async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ message: "A valid email address is required" });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existing = runtimeState.dbConnected
      ? await User.findOne({ email: normalizedEmail })
      : memoryStore.getUserByEmail(normalizedEmail);

    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userPayload = {
      name: (typeof name === "string" && name.trim()) || "Gym User",
      email: normalizedEmail,
      password: hashedPassword,
      hasProfile: false
    };

    const user = runtimeState.dbConnected
      ? await User.create(userPayload)
      : memoryStore.createUser(userPayload);

    res.status(201).json({
      token: signToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    res.status(500).json({ message: "Unable to complete registration" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const user = runtimeState.dbConnected
      ? await User.findOne({ email: normalizedEmail }).select("+password")
      : memoryStore.getUserByEmail(normalizedEmail);

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: signToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Unable to process login" });
  }
};

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

    const errors = {};
    if (age === undefined || age === null || Number.isNaN(Number(age))) errors.age = "Valid age is required";
    if (heightCm === undefined || heightCm === null || Number.isNaN(Number(heightCm))) errors.heightCm = "Valid height is required";
    if (weightKg === undefined || weightKg === null || Number.isNaN(Number(weightKg))) errors.weightKg = "Valid weight is required";
    if (!gender || !["male", "female", "other"].includes(gender)) errors.gender = "Valid gender is required";
    if (!fitnessGoal) errors.fitnessGoal = "Fitness goal is required";
    if (!experienceLevel) errors.experienceLevel = "Experience level is required";

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Invalid profile data", errors });
    }

    const profileData = {
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
      injuriesLimitations: typeof injuriesLimitations === "string" ? injuriesLimitations : "",
      hasProfile: true
    };

    // Check if user is authenticated (update existing profile and connect to authenticated user ID)
    let existingUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], jwtSecret);
        if (decoded?.userId) {
          existingUserId = decoded.userId;
        }
      } catch {
        // Token invalid or expired, fallback to creating profile
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
          ? await User.findByIdAndUpdate(user._id, { $set: profileData }, { new: true })
          : memoryStore.updateUser(user._id, profileData);
        isUpdate = true;
      }
    }

    if (!user) {
      user = runtimeState.dbConnected
        ? await User.create(profileData)
        : memoryStore.createUser(profileData);
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
      user: sanitizeUser(user),
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

    if (error.code === 11000) {
      const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : "field";
      return res.status(409).json({
        message: `A profile with this ${field} already exists.`,
        conflictField: field
      });
    }

    res.status(500).json({ message: "Unable to create profile" });
  }
};

export const me = async (req, res) => {
  res.json(sanitizeUser(req.user));
};
