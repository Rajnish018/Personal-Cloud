import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
  {
    // Owner of the share
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Resource being shared – either a file or a folder
    resourceType: {
      type: String,
      enum: ["file", "folder"],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Unique token for the share link
    shareToken: {
      type: String,
      required: true,
      unique: true,
    },
    // Full share link (optional storage for convenience)
    shareLink: {
      type: String,
    },
    // Access control type
    accessType: {
      type: String,
      enum: ["public", "private", "restricted"],
      default: "private",
    },
    // Permissions granted to the link holder
    permissions: {
      type: [String],
      enum: ["view", "comment", "download", "edit", "owner"],
      default: ["view"],
    },
    // Specific collaborators
    sharedWith: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        permission: {
          type: String,
          enum: ["view", "comment", "download", "edit", "owner"],
          required: true,
        },
      },
    ],
    passwordProtected: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    allowDownload: {
      type: Boolean,
      default: true,
    },
    allowCopy: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// TTL index for automatic expiration of shares
shareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Share", shareSchema);