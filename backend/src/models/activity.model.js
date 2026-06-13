import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      enum: [
        "upload",
        "download",
        "delete",
        "restore",
        "rename",
        "move",
        "share",
        "login"
      ],
      required: true,
    },

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

    details: {
      type: Object,
      default: {},
    },

    ipAddress: String,
  },
  { timestamps: true }
);

export default mongoose.model(
  "Activity",
  activitySchema
);
