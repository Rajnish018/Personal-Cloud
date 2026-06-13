import dotenv from "dotenv";
dotenv.config();

import http from "http";
import mongoose from "mongoose";

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

const PORT = Number(process.env.PORT) ;
const NODE_ENV = process.env.NODE_ENV || "development";


let server;
let isShuttingDown = false;

/**
 * Validate Environment Variables
 */
const validateEnv = () => {
  const required = [
    "MONGO_URI",
    "JWT_SECRET",
  ];

  const missing = required.filter(
    (key) => !process.env[key]
  );

  if (missing.length) {
    console.error(
      `Missing environment variables: ${missing.join(", ")}`
    );

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

    server = http.createServer(app);

    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    server.requestTimeout = 300000;

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
    });

    server.on("error", (error) => {
      switch (error.code) {
        case "EADDRINUSE":
          console.error(
            ` Port ${PORT} is already in use`
          );
          break;

        case "EACCES":
          console.error(
            ` Port ${PORT} requires elevated privileges`
          );
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
    if (server) {
      await new Promise((resolve) =>
        server.close(resolve)
      );

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