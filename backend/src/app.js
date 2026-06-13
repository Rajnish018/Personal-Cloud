import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.route.js";
import folderRoutes from "./routes/folder.route.js";
import fileRoutes from "./routes/file.route.js";

const app = express();

/**
 * Security
 */
app.use(helmet());

/**
 * Compression
 */
app.use(compression());

/**
 * CORS
 */
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(",") || "*",
    credentials: true,
  })
);

/**
 * Body Parsers
 */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

/**
 * Logging
 */
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

/**
 * Rate Limiter
 */
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
  })
);

/**
 * Health Check
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server Healthy",
    timestamp: new Date(),
  });
});

/**
 * Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/files", fileRoutes);

/**
 * 404
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

export default app;