import mongoose from "mongoose";
import { setDbConnected } from "./runtime.js";

export const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === "production";
  const uri = process.env.MONGODB_URI || (isProduction ? null : "mongodb://127.0.0.1:27017/ai_virtual_gym");

  if (!uri) {
    setDbConnected(false);
    const error = new Error("MONGODB_URI is required in production");
    error.code = "MONGODB_URI_MISSING";
    throw error;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    setDbConnected(true);
    console.log("MongoDB connected");
  } catch (error) {
    setDbConnected(false);
    console.error("MongoDB connection failed", {
      name: error.name,
      code: typeof error.code === "string" || typeof error.code === "number" ? error.code : undefined,
      hint: "Check MongoDB Atlas network access, credentials, and cluster availability."
    });
    throw error;
  }
};
