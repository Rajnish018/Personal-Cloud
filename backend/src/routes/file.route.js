import express from "express";

import {
  uploadFile,
  getFiles,
  getFile,
  renameFile,
  moveFile,
  toggleStarFile,
  deleteFile,
  restoreFile,
  permanentlyDeleteFile,
  getRecentFiles,
} from "../controllers/file.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect);

router.post(
  "/upload",
  upload.single("file"),
  uploadFile
);

router.get("/", getFiles);

router.get("/recent", getRecentFiles);

router.get("/:fileId", getFile);

router.put(
  "/:fileId/rename",
  renameFile
);

router.put(
  "/:fileId/move",
  moveFile
);

router.put(
  "/:fileId/star",
  toggleStarFile
);

router.delete(
  "/:fileId",
  deleteFile
);

router.put(
  "/:fileId/restore",
  restoreFile
);

router.delete(
  "/:fileId/permanent",
  permanentlyDeleteFile
);

export default router;