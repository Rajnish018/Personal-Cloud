import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: String,

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        role: {
          type: String,
          enum: [
            "owner",
            "admin",
            "editor",
            "viewer"
          ],
          default: "viewer",
        },
      },
    ],

    storageLimit: {
      type: Number,
      default: 50 * 1024 * 1024 * 1024,
    },

    storageUsed: {
      type: Number,
      default: 0,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "Workspace",
  workspaceSchema
);