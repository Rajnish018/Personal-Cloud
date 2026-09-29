import express from "express";
import { getBillingSummary, getPlans, upgradePlan } from "../controllers/billing.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// GET /api/billing/plans
router.get("/plans", getPlans);

// GET /api/billing/summary
router.get("/summary", getBillingSummary);

// POST /api/billing/upgrade
router.post("/upgrade", upgradePlan);

export default router;
