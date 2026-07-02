// backend/src/jobs/purgeUserQueue.js
// Bull queue for delayed user purge (30‑day grace period)

import Bull from "bull";
import IORedis from "ioredis";

// Redis connection – use env var or default to localhost
const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const redis = new IORedis(redisUrl);

// Create a bull queue named "purgeUser"
export const purgeUserQueue = new Bull("purgeUser", {
  createClient: function (type) {
    switch (type) {
      case "client":
        return redis;
      case "subscriber":
        return new IORedis(redisUrl);
      default:
        return new IORedis(redisUrl);
    }
  },
  // Optional: set attempts and backoff for robustness
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 60000 }, // 1 min backoff
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Export a helper to schedule a purge with a custom delay (ms)
export const scheduleUserPurge = (userId, delayMs) => {
  purgeUserQueue.add({ userId }, { delay: delayMs });
};
