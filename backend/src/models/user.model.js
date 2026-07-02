import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: {
      publicId: { type: String, default: null },
      secureUrl: { type: String, default: null },
    },
    accountType: { type: String, enum: ["free", "pro", "business"], default: "free" },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null, select: false },
    refreshTokenHash: { type: String, default: null, select: false },
    isDeleted: { type: Boolean, default: false, index: true },

    // Soft‑delete fields
    deletionPending: { type: Boolean, default: false, index: true },
    deletionRequestedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },

    isBlocked: { type: Boolean, default: false, index: true },
    storageUsed: { type: Number, default: 0 },
    storageLimit: { type: Number, default: 5 * 1024 * 1024 * 1024 },
    storagePath: { type: String, required: true, unique: true },

    emailVerificationOTP: { type: String },
    emailVerificationOTPExpires: { type: Date },
    emailVerifiedAt: { type: Date, default: null },
    emailVerificationAttempts: { type: Number, default: 0 },
    lastVerificationEmailSentAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to compute remaining days of the 30‑day grace period
userSchema.virtual('deletionGraceRemaining').get(function () {
  if (!this.deletionPending || !this.deletionRequestedAt) return 0;
  const GRACE_MS = 30 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - this.deletionRequestedAt.getTime();
  const remainingMs = Math.max(GRACE_MS - elapsed, 0);
  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
});

const User = mongoose.model("User", userSchema);

export default User;
