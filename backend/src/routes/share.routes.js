import express from "express";

import {
  createShare,
  getSharedResource,
  revokeShare,
  getMyShares,
  updateSharePermission,
  shareFileById,
  shareFolderById,
  getSharedWithMe,
  downloadSharedFile,
} from "../controllers/share.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createShare);

router.post("/file/:id", protect, shareFileById);

router.post("/folder/:id", protect, shareFolderById);

router.get("/shared-with-me", protect, getSharedWithMe);

router.get("/", protect, getMyShares);

router.get(
  "/:shareToken/resource",
  getSharedResource
);

router.get(
  "/:shareToken/download",
  downloadSharedFile
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
