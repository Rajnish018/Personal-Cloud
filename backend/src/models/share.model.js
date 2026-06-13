import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
  {
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
    },

    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    shareToken: {
      type: String,
      required: true,
      unique: true,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    password: {
      type: String,
      default: null,
    },

    permission: {
      type: String,
      enum: ["view", "comment", "edit"],
      default: "view",
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    accessCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Share", shareSchema);