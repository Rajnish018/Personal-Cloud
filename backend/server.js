import "./src/config/env.js";

import http from "http";
import mongoose from "mongoose";

import app from "./src/app.js"; // Importing your express configuration
import { initSocket } from "./src/socket.js";
import connectDB from "./src/config/db.js";

import startMinio from "./startMinio.js";
import { assertStorageReady } from "./src/services/storageProvider.js";
import { startStorageSyncWorker, stopStorageSyncWorker } from "./src/services/storageSyncWorker.js";

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

if ((process.env.STORAGE_PROVIDER || "minio").toLowerCase() === "minio" && NODE_ENV !== "production") {
  startMinio();
}

let server;
let isShuttingDown = false;

/**
 * Validate Environment Variables
 */
const validateEnv = () => {
  const required = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
  const provider = (process.env.STORAGE_PROVIDER || "minio").toLowerCase();

  if (provider === "minio") {
    required.push("MINIO_ENDPOINT", "MINIO_PORT", "MINIO_ACCESS_KEY", "MINIO_SECRET_KEY");
  } else if (provider === "mega") {
    required.push("MEGA_EMAIL", "MEGA_PASSWORD");
  } else if (provider === "dual") {
    // MEGA is required; MinIO may be offline and will catch up later.
    required.push("MEGA_EMAIL", "MEGA_PASSWORD");
  } else {
    console.error(`Unsupported STORAGE_PROVIDER: ${provider}`);
    process.exit(1);
  }

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
};

/**
 * Start Server
 */
const startServer = async () => {
  try {
    validateEnv();

    await connectDB();
    await assertStorageReady();
    console.log(`Storage provider: ${process.env.STORAGE_PROVIDER || "minio"}`);
    startStorageSyncWorker();

    // Passing our completely pre-configured express app to the server instance
    server = http.createServer(app);

    // Initialise Socket.IO for real‑time notifications
    initSocket(server);

    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    server.requestTimeout = 300000;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    });

    server.on("error", (error) => {
      switch (error.code) {
        case "EADDRINUSE":
          console.error(` Port ${PORT} is already in use`);
          break;

        case "EACCES":
          console.error(` Port ${PORT} requires elevated privileges`);
          break;

        default:
          console.error(error);
      }

      process.exit(1);
    });
  } catch (error) {
    console.error(" Server startup failed");
    console.error(error);

    process.exit(1);
  }
};

startServer();

/**
 * Graceful Shutdown
 */
const shutdown = async (signal) => {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log(`\n ${signal} received`);

  try {
    stopStorageSyncWorker();

    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log(" HTTP Server Closed");
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log(" MongoDB Connection Closed");
    }

    process.exit(0);
  } catch (error) {
    console.error(" Shutdown Error");
    console.error(error);

    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

/**
 * Unhandled Promise Rejections
 */
process.on("unhandledRejection", async (reason) => {
  console.error(" Unhandled Rejection");
  console.error(reason);

  await shutdown("UNHANDLED_REJECTION");
});

/**
 * Uncaught Exceptions
 */
process.on("uncaughtException", async (error) => {
  console.error(" Uncaught Exception");
  console.error(error);

  await shutdown("UNCAUGHT_EXCEPTION");
});

/**
 * MongoDB Monitoring
 */
mongoose.connection.on("connected", () => {
  console.log(" MongoDB Connected");
});

mongoose.connection.on("disconnected", () => {
  console.warn(" MongoDB Disconnected");
});

mongoose.connection.on("error", (error) => {
  console.error(" MongoDB Error");
  console.error(error);
});

export default app;
