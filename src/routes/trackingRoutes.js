import express from "express";
import { addWater, getLogs, upsertTodayLog } from "../controllers/trackingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/today", protect, upsertTodayLog);
router.post("/water", protect, addWater);
router.get("/logs", protect, getLogs);

export default router;
