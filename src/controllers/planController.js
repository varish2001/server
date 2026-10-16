import { DietPlan } from "../models/DietPlan.js";
import { User } from "../models/User.js";
import { WorkoutPlan } from "../models/WorkoutPlan.js";
import { generatePersonalizedPlans } from "../services/recommendationService.js";
import { buildDietPlan, normalizeDietProfile, shapeDietPlanResponse } from "../services/dietPlanService.js";
import { buildWorkoutPlan, normalizeWorkoutProfile } from "../services/workoutPlanService.js";
import { runtimeState } from "../config/runtime.js";
import { memoryStore } from "../store/memoryStore.js";

const workoutPayload = (plan) => ({
  goal: plan.goal,
  goalKey: plan.goalKey,
  level: plan.experienceLevel,
  split: plan.split,
  workoutDaysPerWeek: plan.workoutDaysPerWeek,
  equipmentPreference: plan.equipmentPreference,
  experienceLevel: plan.experienceLevel,
  weeklyPlan: plan.weeklyPlan,
  weeklySchedule: plan.weeklyPlan?.map((day) => ({
    day: day.day,
    muscleGroup: day.focus,
    focus: day.focus,
    exercises: day.exercises?.map((exercise) => ({
      ...exercise,
      notes: exercise.tips
    }))
  })),
  warmUp: plan.warmUp,
  coolDown: plan.coolDown,
  progressiveOverload: plan.progressiveOverload,
  recoveryTips: plan.recoveryTips,
  restDays: plan.restDays,
  generatedAt: plan.generatedAt
});

const planToPlain = (plan) => (typeof plan?.toObject === "function" ? plan.toObject() : plan);

const persistWorkoutPlan = async (userId, plan) => {
  const payload = workoutPayload(plan);
  return runtimeState.dbConnected
    ? WorkoutPlan.findOneAndUpdate({ userId }, payload, { upsert: true, new: true })
    : memoryStore.upsertWorkout(userId, payload);
};

const updateWorkoutProfile = async (user, patch) => {
  if (!Object.keys(patch).length) return user;
  return runtimeState.dbConnected
    ? User.findByIdAndUpdate(user._id, patch, { new: true })
    : memoryStore.updateUser(user._id, patch);
};

const savedPlanIsCurrentShape = (plan) => {
  const plain = planToPlain(plan);
  return Array.isArray(plain?.weeklyPlan) && plain.weeklyPlan.length > 0;
};

export const getWorkoutPlan = async (req, res) => {
  let plan = runtimeState.dbConnected
    ? await WorkoutPlan.findOne({ userId: req.user._id })
    : memoryStore.getWorkout(req.user._id);
  if (!plan || !savedPlanIsCurrentShape(plan)) {
    const { workout, source } = await generatePersonalizedPlans(req.user);
    plan = await persistWorkoutPlan(req.user._id, workout);
    const plain = planToPlain(plan);
    return res.json({ ...plain, recommendationSource: source });
  }
  res.json(plan);
};

export const getDietPlan = async (req, res) => {
  let plan = runtimeState.dbConnected ? await DietPlan.findOne({ userId: req.user._id }) : memoryStore.getDiet(req.user._id);
  if (!plan) {
    const { diet, source } = await generatePersonalizedPlans(req.user);
    plan = runtimeState.dbConnected
      ? await DietPlan.create({
          userId: req.user._id,
          ...diet
        })
      : memoryStore.upsertDiet(req.user._id, diet);
    const plain = typeof plan.toObject === "function" ? plan.toObject() : plan;
    return res.json({ ...shapeDietPlanResponse(plain, req.user), recommendationSource: source });
  }
  const plain = typeof plan.toObject === "function" ? plan.toObject() : plan;
  res.json(shapeDietPlanResponse(plain, req.user));
};

export const regeneratePlans = async (req, res) => {
  const { workout, diet, source } = await generatePersonalizedPlans(req.user);

  const workoutPlan = await persistWorkoutPlan(req.user._id, workout);

  const dietPlan = runtimeState.dbConnected
    ? await DietPlan.findOneAndUpdate(
        { userId: req.user._id },
        {
          ...diet
        },
        { upsert: true, new: true }
      )
    : memoryStore.upsertDiet(req.user._id, diet);

  const plainDiet = typeof dietPlan?.toObject === "function" ? dietPlan.toObject() : dietPlan;
  res.json({ workoutPlan, dietPlan: shapeDietPlanResponse(plainDiet, req.user), recommendationSource: source });
};

export const createDietPlan = async (req, res) => {
  try {
    const profile = normalizeDietProfile({
      ...req.user,
      ...req.body
    });
    const plan = buildDietPlan(profile);
    res.json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to generate diet plan." });
  }
};

export const createWorkoutPlan = async (req, res) => {
  try {
    const requestedProfile = normalizeWorkoutProfile({
      ...req.user,
      ...req.body
    });
    const profilePatch = {
      fitnessGoal: requestedProfile.goal,
      experienceLevel: requestedProfile.experienceLevel,
      workoutDaysPerWeek: requestedProfile.workoutDaysPerWeek,
      equipmentPreference: requestedProfile.equipmentPreference,
      injuriesLimitations: requestedProfile.injuriesLimitations
    };
    const updatedUser = await updateWorkoutProfile(req.user, profilePatch);
    const plan = buildWorkoutPlan({
      ...(planToPlain(updatedUser) || req.user),
      ...req.body,
      ...profilePatch
    });
    const saved = await persistWorkoutPlan(req.user._id, plan);
    res.json(planToPlain(saved));
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to generate workout plan." });
  }
};
