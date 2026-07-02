import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

import {
  uploadFile,
} from "../controllers/upload.controller.js";

const router = express.Router();

router.post(
  "/upload",

  protect,

  upload.single("file"),

  uploadFile
);

export default router;