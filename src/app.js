import "dotenv/config";
import cors from "cors";
import express from "express";
import userRoutes from "./routes/userRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { createDietPlan, createWorkoutPlan } from "./controllers/planController.js";
import { protect } from "./middleware/auth.js";

export const app = express();

const normalizeOrigin = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
};

const allowedOrigins = new Set(
  [
    "https://client0-seven.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.CLIENT_URL,
    ...(process.env.CLIENT_URLS?.split(",") ?? []),
  ]
    .map(normalizeOrigin)
    .filter((origin) => origin !== null)
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalizedOrigin = normalizeOrigin(origin);
      if (normalizedOrigin && allowedOrigins.has(normalizedOrigin)) return callback(null, true);

      const error = new Error("CORS origin rejected");
      error.code = "CORS_ORIGIN_DENIED";
      error.origin = origin;
      return callback(error);
    },
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204
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
  if (res.headersSent) return next(error);

  if (error.code === "CORS_ORIGIN_DENIED") {
    console.warn("Rejected CORS origin:", JSON.stringify(error.origin).slice(0, 200));
    return res.status(403).json({ message: "Origin is not allowed" });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON request body" });
  }

  console.error("Unhandled request error", {
    name: error.name,
    code: typeof error.code === "string" || typeof error.code === "number" ? error.code : undefined
  });
  res.status(500).json({ message: "Internal server error" });
});
