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
  emptyTrashFiles,
  getRecentFiles,
  getStarredFiles,
  getTrashFiles,
  downloadFile,
  copyFile,
  getStorageMetrics,
} from "../controllers/file.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

router.use(protect);

router.param("fileId", (req, res, next, fileId) => {
  if (!objectIdPattern.test(fileId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid file id",
    });
  }

  return next();
});

router.post(
  "/upload",
  upload.single("file"),
  uploadFile
);

router.get("/", getFiles);

router.get("/recent", getRecentFiles);

router.get("/starred", getStarredFiles);

router.get("/trash", getTrashFiles);

router.get("/storage-metrics", getStorageMetrics);

router.delete("/trash/empty", emptyTrashFiles);

router.get("/:fileId", getFile);

router.get("/:fileId/download", downloadFile);

router.post("/:fileId/copy", copyFile);

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
