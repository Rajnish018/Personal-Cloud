import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    link: { type: String },
    type: {
      type: String,
      enum: [
        "FILE_SHARED",
        "FOLDER_SHARED",
        "FILE_UPLOADED",
        "FILE_DELETED",
        "FILE_RESTORED",
        "FILE_MOVED",
        "FILE_RENAMED",
        "FILE_STARRED",
        "COMMENT_ADDED",
        "SHARE_ACCEPTED",
        "SHARE_REVOKED",
        "PERMISSION_CHANGED",
        "FOLDER_CREATED",
        "FILE_DOWNLOADED",
        "STORAGE_LIMIT_WARNING"
      ],
      required: true,
    },

    title: String,

    message: String,

    isRead: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "Notification",
  notificationSchema
);