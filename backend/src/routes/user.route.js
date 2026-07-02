import express from "express";
import multer from "multer";
import {
  getProfile,
  resendVerificationOTP,
  sendVerificationOTP,
  updateProfile,
  uploadAvatar,
  verifyEmail,
  verifyEmailOTP,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import upload, { isCloudinaryConfigured } from "../services/uploadProfieService.js";

const router = express.Router();

const uploadAvatarFile = (req, res, next) => {
  if (!isCloudinaryConfigured()) {
    return res.status(500).json({
      success: false,
      message: "Cloudinary is not configured on the server",
    });
  }

  upload.single("avatar")(req, res, (error) => {
    if (!error) {
      return next();
    }

    console.error("[avatar-upload]", {
      name: error.name,
      code: error.code,
      message: error.message,
    });

    return res.status(400).json({
      success: false,
      message:
        error instanceof multer.MulterError
          ? error.message
          : error.message || "Profile photo upload failed",
    });
  });
};

router.use(protect);

router.post(
  "/profile/avatar",
  uploadAvatarFile,
  uploadAvatar,
);


router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// router.post("/verify-email", verifyEmail);

router.post("/verify-email/send", sendVerificationOTP);
router.post("/verify-email/confirm", verifyEmailOTP);
router.post("/verify-email/resend", resendVerificationOTP);

export default router;
