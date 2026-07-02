import express from "express";
import { calculateUsage } from "../services/storageService.js";

const router = express.Router();

// GET /api/storage/status - returns usage information for authenticated user
router.get("/status", async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const usage = await calculateUsage(userId);
    return res.status(200).json({ success: true, data: usage });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Failed to fetch storage status" });
  }
});

export default router;
