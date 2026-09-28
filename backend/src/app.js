import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "../src/routes/auth.route.js";
import userRoutes from "../src/routes/user.route.js";
import folderRoutes from "../src/routes/folder.route.js";
import fileRoutes from "../src/routes/file.route.js";
import shareRoutes from "../src/routes/share.routes.js";
import uploadRoutes from "../src/routes/upload.route.js";
import notificationRoutes from "../src/routes/notification.routes.js";
import storageRoutes from "./routes/storage.route.js";
import billingRoutes from "./routes/billing.route.js";
import supportRoutes from "../src/routes/support.route.js";
import errorHandler from "../src/middleware/error.middleware.js";

const app = express();

/* -------------------------------------------------------------------------- */
/*                                  CORS                                      */
/* -------------------------------------------------------------------------- */

const allowedOrigins = (
  process.env.CLIENT_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked origin: ${origin}`);

      return callback(null, false);
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
      "Pragma",
    ],

    exposedHeaders: [
      "Content-Length",
      "Content-Range",
      "Accept-Ranges",
    ],

    optionsSuccessStatus: 204,
  })
);

/* -------------------------------------------------------------------------- */
/*                                SECURITY                                    */
/* -------------------------------------------------------------------------- */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

/* -------------------------------------------------------------------------- */
/*                              COMPRESSION                                   */
/* -------------------------------------------------------------------------- */

app.use(compression());

/* -------------------------------------------------------------------------- */
/*                             BODY PARSERS                                   */
/* -------------------------------------------------------------------------- */

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* -------------------------------------------------------------------------- */
/*                              COOKIES                                       */
/* -------------------------------------------------------------------------- */

const parseCookies = (req, res, next) => {
  req.cookies = Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");

        if (index === -1) {
          return [cookie.trim(), ""];
        }

        const key = cookie
          .slice(0, index)
          .trim();

        const value = cookie
          .slice(index + 1)
          .trim();

        return [
          key,
          decodeURIComponent(value),
        ];
      })
  );

  next();
};

app.use(parseCookies);

/* -------------------------------------------------------------------------- */
/*                              SANITIZATION                                  */
/* -------------------------------------------------------------------------- */

const sanitizeObject = (value) => {
  if (!value || typeof value !== "object") {
    return value;
  }

  for (const key of Object.keys(value)) {
    if (
      key.startsWith("$") ||
      key.includes(".")
    ) {
      delete value[key];
      continue;
    }

    if (typeof value[key] === "string") {
      value[key] = value[key].replace(
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        ""
      );
    } else {
      sanitizeObject(value[key]);
    }
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query);

  next();
};

app.use(sanitizeRequest);

/* -------------------------------------------------------------------------- */
/*                                  LOGGING                                   */
/* -------------------------------------------------------------------------- */

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

/* -------------------------------------------------------------------------- */
/*                              RATE LIMIT                                    */
/* -------------------------------------------------------------------------- */

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,

    message: {
      success: false,
      message:
        "Too many requests. Please try again later.",
    },
  })
);

/* -------------------------------------------------------------------------- */
/*                               HEALTH CHECK                                 */
/* -------------------------------------------------------------------------- */

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server Healthy",
    timestamp: new Date(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Cloud Storage API",
    timestamp: new Date(),
  });
});

/* -------------------------------------------------------------------------- */
/*                                  ROUTES                                    */
/* -------------------------------------------------------------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/support", supportRoutes);

/* -------------------------------------------------------------------------- */
/*                                    404                                     */
/* -------------------------------------------------------------------------- */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

/* -------------------------------------------------------------------------- */
/*                              ERROR HANDLER                                 */
/* -------------------------------------------------------------------------- */

app.use(errorHandler);

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
