import express from "express";

import {
  register,
  login,
  refreshAccessToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  restoreAccount,
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/refresh", refreshAccessToken);

router.post("/logout", logout);

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

// New restore account endpoint (public, uses email payload)
router.post("/restore-account", restoreAccount);

export default router;
