import express from "express";

import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/profile", protect, getProfile);

router.put("/profile", protect, updateProfile);

router.put(
  "/change-password",
  protect,
  changePassword
);

router.delete(
  "/delete-account",
  protect,
  deleteAccount
);

export default router;