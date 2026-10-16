import express from "express";
import { createDietPlan, createWorkoutPlan, getDietPlan, getWorkoutPlan, regeneratePlans } from "../controllers/planController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/workout", protect, getWorkoutPlan);
router.get("/diet", protect, getDietPlan);
router.post("/workout-plan", protect, createWorkoutPlan);
router.post("/diet-plan", protect, createDietPlan);
router.post("/regenerate", protect, regeneratePlans);

export default router;
