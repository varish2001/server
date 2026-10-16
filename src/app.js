import cors from "cors";
import express from "express";
import userRoutes from "./routes/userRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { createDietPlan, createWorkoutPlan } from "./controllers/planController.js";
import { protect } from "./middleware/auth.js";

export const app = express();

const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    process.env.CLIENT_URLS?.split(","),
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ]
    .flat()
    .filter(Boolean)
    .map((origin) => origin.trim())
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      if (/^http:\/\/192\.168\.\d+\.\d+:5173$/.test(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for this origin"));
    },
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.post("/api/diet-plan", protect, createDietPlan);
app.post("/api/workout-plan", protect, createWorkoutPlan);
app.use("/api/users", userRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/chat", chatRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ message: "Internal server error" });
});
