import cloudinary from "../config/cloudinary.js";
import File from "../models/file.model.js";
import Folder from "../models/folder.model.js";
import Share from "../models/share.model.js";
import User from "../models/user.model.js";
import crypto from "crypto";
import transporter from "../config/mail.js";
const formatUser = (user, storage = null) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  accountType: user.accountType,
  isEmailVerified: user.isEmailVerified,
  storageUsed: storage?.used ?? user.storageUsed,
  storageLimit: user.storageLimit,
  storageRemaining: Math.max(user.storageLimit - (storage?.used ?? user.storageUsed), 0),
  joinedAt: user.createdAt,
});

const uploadBufferToCloudinary = async (file, options) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadParams = {
    ...options,
    timestamp,
  };
  const signature = cloudinary.utils.api_sign_request(
    uploadParams,
    process.env.CLOUDINARY_API_SECRET
  );
  const formData = new FormData();
  const blob = new Blob([file.buffer], { type: file.mimetype });
  const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;

  formData.set("file", blob, file.originalname || "avatar");
  formData.set("api_key", process.env.CLOUDINARY_API_KEY);
  formData.set("signature", signature);

  Object.entries(uploadParams).forEach(([key, value]) => {
    formData.set(key, String(value));
  });

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.error?.message || `Cloudinary upload failed with status ${response.status}`
    );
    error.http_code = response.status;
    throw error;
  }

  return data;
};

export const getStorageSummary = async (userId, storageLimit) => {
  const [storage] = await File.aggregate([
    {
      $match: {
        owner: userId,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        used: { $sum: "$size" },
        totalFiles: { $sum: 1 },
        starredFiles: {
          $sum: { $cond: ["$isStarred", 1, 0] },
        },
        sharedFiles: {
          $sum: { $cond: ["$isShared", 1, 0] },
        },
      },
    },
  ]);

  const [totalFolders, activeShareLinks] = await Promise.all([
    Folder.countDocuments({
      owner: userId,
      isDeleted: false,
    }),
    Share.countDocuments({
      owner: userId,
    }),
  ]);

  const used = storage?.used || 0;

  return {
    used,
    remaining: Math.max(storageLimit - used, 0),
    total: storageLimit,
    totalFiles: storage?.totalFiles || 0,
    totalFolders,
    starredFiles: storage?.starredFiles || 0,
    sharedFiles: activeShareLinks,
  };
};

export const getProfile = async (req, res) => {
  const storage = await getStorageSummary(req.user._id, req.user.storageLimit);

  await User.findByIdAndUpdate(req.user._id, {
    storageUsed: storage.used,
  });

  return res.status(200).json({
    success: true,
    user: formatUser(req.user, storage),
    storage,
  });
};

export const updateProfile = async (req, res) => {
  const { name, email } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(422).json({
      success: false,
      message: "Name and email are required",
    });
  }

  const existingEmail = await User.findOne({
    email: email.toLowerCase(),
    _id: { $ne: req.user._id },
  });

  if (existingEmail) {
    return res.status(409).json({
      success: false,
      message: "Email already in use",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: name.trim(),
      email: email.toLowerCase(),
      isEmailVerified:
        email.toLowerCase() === req.user.email ? req.user.isEmailVerified : false,
    },
    { new: true, runValidators: true }
  );

  const storage = await getStorageSummary(user._id, user.storageLimit);

  return res.status(200).json({
    success: true,
    message: "Profile updated",
    user: formatUser(user, storage),
    storage,
  });
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile photo is required",
      });
    }

    const result = await uploadBufferToCloudinary(req.file, {
      folder: `users/${req.user._id}/profile`,
      public_id: "avatar",
      overwrite: true,
      invalidate: true,
    });

    const publicId = result.public_id;
    const secureUrl = result.secure_url;

    if (!publicId || !secureUrl) {
      return res.status(400).json({
        success: false,
        message: "Profile photo upload failed",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: { publicId, secureUrl },
      },
      { new: true }
    );

    const storage = await getStorageSummary(user._id, user.storageLimit);

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      user: formatUser(user, storage),
      storage,
    });
  } catch (error) {
    console.error("[avatar-upload]", {
      name: error.name,
      httpCode: error.http_code,
      message: error.message,
    });

    return res.status(error.http_code || 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};


export const verifyEmail = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      isEmailVerified: true,
      emailVerificationTokenHash: null,
    },
    { new: true }
  );

  return res.status(200).json({
    success: true,
    message: "Email verified",
    user: formatUser(user),
  });
};

export const sendVerificationOTP = async (req, res) => {
  try {
    const otp = crypto.randomInt(100000, 999999).toString();

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000;
    await user.save();


    // Send verification email using shared Gmail transporter
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Personal Cloud" <no-reply@${process.env.SMTP_HOST}>`,
      to: user.email,
      subject: "Your Personal Cloud verification code",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
          <h2 style="color:#2c3e50;">Personal Cloud Email Verification</h2>
          <p>Hello ${user.name || 'User'},</p>
          <p>Please use the following <strong>one‑time password (OTP)</strong> to verify your email. The code expires in <strong>10 minutes</strong>:</p>
          <p style="font-size:24px;font-weight:bold;letter-spacing:2px;color:#2980b9;">${otp}</p>
          <p>If you did not request this code, please ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;"/>
          <p style="font-size:12px;color:#777;">© ${new Date().getFullYear()} Personal Cloud. All rights reserved.</p>
        </div>`
    };
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Verification code sent.",
    });
  } catch (error) {
    console.error("[sendVerificationOTP] Error:", error);
    return res.status(error.http_code || 500).json({
      success: false,
      message: error.message || "Failed to send verification code",
    });
  }
};

export const verifyEmailOTP = async (req, res) => {

  const { otp } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (
    user.emailVerificationOTP !== otp ||
    user.emailVerificationOTPExpires < Date.now()
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationOTPExpires = undefined;

  await user.save();

  return res.json({
    success: true,
    message: "Email verified successfully",
    user: formatUser(user),
  });
};

export const resendVerificationOTP = async (req, res) => {

  const otp = crypto.randomInt(100000, 999999).toString();

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  user.emailVerificationOTP = otp;
  user.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000;

  await user.save();

  // Send verification email (same template as sendVerificationOTP)
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Personal Cloud" <no-reply@${process.env.SMTP_HOST}>`,
    to: user.email,
    subject: "Your Personal Cloud verification code",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e0e0e0;border-radius:8px;">
        <h2 style="color:#2c3e50;">Personal Cloud Email Verification</h2>
        <p>Hello ${user.name || 'User'},</p>
        <p>Please use the following <strong>one‑time password (OTP)</strong> to verify your email. The code expires in <strong>10 minutes</strong>:</p>
        <p style="font-size:24px;font-weight:bold;letter-spacing:2px;color:#2980b9;">${otp}</p>
        <p>If you did not request this code, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;"/>
        <p style="font-size:12px;color:#777;">© ${new Date().getFullYear()} Personal Cloud. All rights reserved.</p>
      </div>`
  };
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("[resendVerificationOTP] Email send error:", err);
    // Continue anyway – the OTP is stored; client can retry.
  }

  return res.json({
    success: true,
    message: "OTP resent successfully",
  });
};
