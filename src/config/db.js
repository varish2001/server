import mongoose from "mongoose";
import { setDbConnected } from "./runtime.js";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai_virtual_gym";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    setDbConnected(true);
    console.log("MongoDB connected");
  } catch (error) {
    setDbConnected(false);
    console.error(`MongoDB connection failed for URI: ${uri}`);
    throw error;
  }
};
