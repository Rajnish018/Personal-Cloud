import { calculateUsage } from "../services/storageService.js";

/**
 * Middleware to enforce storage quota limits on upload routes.
 * It expects `req.user` populated (by authentication middleware) and will
 * block the request with a 403 when the user has reached or exceeded their
 * allocated storage limit.
 */
export const checkStorageLimit = async (req, res, next) => {
  try {
    const userId = req.user && req.user._id ? req.user._id.toString() : null;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthenticated" });
    }
    const { used, limit, percent } = await calculateUsage(userId);
    if (used >= limit) {
      return res.status(403).json({
        success: false,
        message: "Storage quota exceeded. Please upgrade your plan to upload more files.",
        used,
        limit,
        percent,
      });
    }
    // Optionally, you could send a warning when >90% used via a custom header
    if (percent > 90) {
      res.setHeader("X-Storage-Warning", "Approaching storage limit");
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Storage check failed" });
  }
};
