import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import {
  buildAuthPayload,
  hashToken,
  refreshCookieName,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
} from "../utils/authTokens.js";

const publicUserSelect =
  "name email role avatar accountType isEmailVerified storageUsed storageLimit isDeleted isBlocked createdAt";

const issueTokens = async (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie(refreshCookieName, refreshToken, refreshCookieOptions());

  return accessToken;
};

const clearRefreshCookie = (res) => {
  res.clearCookie(refreshCookieName, {
    ...refreshCookieOptions(),
    maxAge: undefined,
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 8) {
      return res.status(422).json({
        success: false,
        message: "Name, valid email, and an 8+ character password are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      // Edge Case: If the account exists but was soft-deleted
      if (existingUser.isDeleted) {
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_DELETED", // Direct hook to guide them to your recovery page
          message: "This email is associated with a deleted account. Please sign in to reactivate it.",
        });
      }

      // Standard Case: Active account already using this email
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // 1. Initialize the instance without saving yet so we get the generated _id
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // 2. Safely assign the generated string ID to your required storagePath field
    user.storagePath = user._id.toString();

    // 3. Perform a single database write that passes validation cleanly
    await user.save();

    const accessToken = await issueTokens(res, user);

    return res.status(201).json({
      ...buildAuthPayload(user, accessToken),
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select(`+password +refreshTokenHash ${publicUserSelect}`);

    // 1. Generic check if user doesn't exist
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 2. Validate password FIRST to prevent account enumeration/discovery
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 3. Check account restrictions ONLY after password validity is confirmed
    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DELETED", // Added unique error code to hook into your frontend React component
        message: "Account deleted",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_BLOCKED",
        message: "Account blocked",
      });
    }

    // 4. Issue tokens and proceed with login if all clear
    const accessToken = await issueTokens(res, user);

    return res.status(200).json({
      ...buildAuthPayload(user, accessToken),
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[refreshCookieName];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        code: "MISSING_REFRESH_TOKEN",
        message: "Refresh token missing",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (error) {
      clearRefreshCookie(res);
      return res.status(401).json({
        success: false,
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid or expired refresh token",
      });
    }

    if (decoded.type !== "refresh") {
      clearRefreshCookie(res);
      return res.status(401).json({
        success: false,
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid refresh token",
      });
    }

    const user = await User.findById(decoded.userId).select(
      `+refreshTokenHash ${publicUserSelect}`
    );

    if (!user || user.isDeleted || user.isBlocked) {
      clearRefreshCookie(res);
      return res.status(401).json({
        success: false,
        code: "INVALID_REFRESH_TOKEN",
        message: "Session is no longer valid",
      });
    }

    if (user.refreshTokenHash !== hashToken(refreshToken)) {
      user.refreshTokenHash = null;
      await user.save({ validateBeforeSave: false });
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token was revoked",
      });
    }

    const accessToken = await issueTokens(res, user);

    return res.status(200).json({
      ...buildAuthPayload(user, accessToken),
      message: "Token refreshed",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to refresh token",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[refreshCookieName];

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await User.updateOne(
        { refreshTokenHash: tokenHash },
        { $set: { refreshTokenHash: null } }
      );
    }

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(422).json({
        success: false,
        message: "Name is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(422).json({
        success: false,
        message: "Current password and an 8+ character new password are required",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        isDeleted: true,
        refreshTokenHash: null,
      }
    );

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};

// New restore account controller
export const restoreAccount = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!user.isDeleted) {
      return res.status(400).json({ success: false, message: "Account is not deleted" });
    }
    // Restore account
    user.isDeleted = false;
    user.deletionPending = false;
    user.deletionRequestedAt = null;
    user.deletedAt = null;
    await user.save();
    return res.status(200).json({ success: true, message: "Account restored successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to restore account" });
  }
};
