import "dotenv/config";
import { app } from "./app.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.MONGODB_URI) {
  console.error("MONGODB_URI is required in production.");
  process.exit(1);
}

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error("JWT_SECRET must contain at least 32 characters in production.");
  process.exit(1);
}

const startServer = () => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}${isProduction ? "" : " (development)"}`);
  });
};

connectDB()
  .then(startServer)
  .catch((error) => {
    if (isProduction) {
      console.error("Failed to connect to MongoDB in production. Check the URI, Atlas network access, and cluster availability.");
      process.exit(1);
    }

    console.warn("Starting without MongoDB for local development.");
    startServer();
  });
