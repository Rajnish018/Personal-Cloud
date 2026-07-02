import crypto from "crypto";
import jwt from "jsonwebtoken";

const accessTokenExpiry = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export const refreshCookieName = "refreshToken";

export const signAccessToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      type: "access",
    },
    process.env.JWT_SECRET,
    { expiresIn: accessTokenExpiry }
  );

export const signRefreshToken = (user) =>
  jwt.sign(
    {
      userId: user._id.toString(),
      tokenVersion: crypto.randomUUID(),
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: refreshTokenExpiry }
  );

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: Number(process.env.REFRESH_COOKIE_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000,
});

export const buildAuthPayload = (user, accessToken) => ({
  success: true,
  accessToken,
  token: accessToken,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    accountType: user.accountType,
    isEmailVerified: user.isEmailVerified,
    storageUsed: user.storageUsed,
    storageLimit: user.storageLimit,
    joinedAt: user.createdAt,
  },
});
