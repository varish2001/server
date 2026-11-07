import express from "express";
import { getStarted, login, me, register } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/get-started", getStarted);
router.get("/me", protect, me);

export default router;
