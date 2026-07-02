import express from "express";

import {
  createFolder,
  getRootFolders,
  getFolderContents,
  renameFolder,
  moveFolder,
  deleteFolder,
  restoreFolder,
  permanentlyDeleteFolder,
  getTrashFolders,
  emptyTrashFolders,
} from "../controllers/folder.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createFolder);

router.get("/", getRootFolders);

router.get("/trash", getTrashFolders);

router.delete("/trash/empty", emptyTrashFolders);

router.get("/:folderId", getFolderContents);

router.put("/:folderId", renameFolder);

router.put("/:folderId/rename", renameFolder);

router.put("/:folderId/move", moveFolder);

router.delete("/:folderId", deleteFolder);

router.put("/:folderId/restore", restoreFolder);

router.delete(
  "/:folderId/permanent",
  permanentlyDeleteFolder
);

export default router;
