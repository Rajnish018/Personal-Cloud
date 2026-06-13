import express from "express";

import {
  createShare,
  getSharedResource,
  revokeShare,
  getMyShares,
  updateSharePermission,
} from "../controllers/share.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createShare);

router.get("/", protect, getMyShares);

router.get(
  "/:shareToken/resource",
  getSharedResource
);

router.put(
  "/:shareId/permission",
  protect,
  updateSharePermission
);

router.delete(
  "/:shareId",
  protect,
  revokeShare
);

export default router;