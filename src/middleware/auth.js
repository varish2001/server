import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { runtimeState } from "../config/runtime.js";
import { memoryStore } from "../store/memoryStore.js";

const jwtSecret = process.env.JWT_SECRET || "dev_jwt_secret_change_me";

export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = runtimeState.dbConnected ? await User.findById(decoded.userId) : memoryStore.getUserById(decoded.userId);
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
