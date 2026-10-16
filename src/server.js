import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

const startServer = () => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}${isProduction ? "" : " (development)"}`);
  });
};

connectDB()
  .then(startServer)
  .catch((error) => {
    if (isProduction) {
      console.error(`Failed to connect to MongoDB in production: ${error.message}`);
      process.exit(1);
    }

    console.warn(`Starting without MongoDB for local development: ${error.message}`);
    startServer();
  });
