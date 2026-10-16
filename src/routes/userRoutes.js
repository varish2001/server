import express from "express";
import { getStarted, me } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/get-started", getStarted);
router.get("/me", protect, me);

export default router;
