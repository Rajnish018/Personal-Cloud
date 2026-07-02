import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Type of resource the activity pertains to (file or folder)
    resourceType: {
      type: String,
      enum: ["file", "folder"],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    // Device information (e.g., browser, OS)
    device: {
      type: String,
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
