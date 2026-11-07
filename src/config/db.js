import mongoose from "mongoose";
import { setDbConnected } from "./runtime.js";

export const auditAndRepairIndexes = async () => {
  if (!mongoose.connection.db) return [];
  const db = mongoose.connection.db;
  const auditReport = [];

  try {
    const collections = await db.listCollections().toArray();
    console.log("MongoDB collections detected:", collections.map((c) => c.name));

    for (const { name } of collections) {
      const col = db.collection(name);
      const indexes = await col.indexes();
      const colReport = { name, indexes: [], droppedIndexes: [] };

      for (const idx of indexes) {
        colReport.indexes.push({
          name: idx.name,
          key: idx.key,
          unique: Boolean(idx.unique),
          sparse: Boolean(idx.sparse)
        });

        if (idx.name === "_id_") continue;

        // If an index is marked unique, verify whether null/missing values violate uniqueness
        if (idx.unique) {
          const keyField = Object.keys(idx.key)[0];
          const nullCount = await col.countDocuments({
            $or: [{ [keyField]: { $exists: false } }, { [keyField]: null }]
          });

          console.log(`[DB Audit] Index '${idx.name}' on '${name}.${keyField}' is unique: true. Documents with missing/null: ${nullCount}`);

          // If a unique index exists on a field that already has null/missing documents,
          // any subsequent insert with missing/null for that field will immediately throw E11000 duplicate key error.
          // Drop the legacy/conflicting unique index to unblock profile creation while preserving all documents.
          if (nullCount >= 1 && (name === "users" || name === "fitnessprofiles" || name === "workoutplans" || name === "dietplans")) {
            console.warn(`[DB Audit] Dropping conflicting unique index '${idx.name}' on '${name}' to resolve E11000 duplicate key error.`);
            try {
              await col.dropIndex(idx.name);
              colReport.droppedIndexes.push(idx.name);
              console.log(`[DB Audit] Successfully dropped index '${idx.name}' on '${name}'.`);
            } catch (dropErr) {
              console.error(`[DB Audit] Failed to drop index '${idx.name}':`, dropErr.message);
            }
          }
        }
      }

      auditReport.push(colReport);
    }
  } catch (err) {
    console.warn("[DB Audit] Index audit warning:", err.message);
  }

  return auditReport;
};

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
    await auditAndRepairIndexes();
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
