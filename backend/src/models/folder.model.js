import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      maxlength: [255, "Folder name cannot exceed 255 characters"],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },

    path: {
      type: String,
      default: "/",
      index: true,
    },

    color: {
      type: String,
      default: "#4285F4",
    },

    isStarred: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    shared: {
      type: Boolean,
      default: false,
    },

    sharedWith: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        permission: {
          type: String,
          enum: ["view", "edit"],
          default: "view",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Prevent duplicate folder names
 * inside the same parent folder
 */
folderSchema.index(
  {
    owner: 1,
    parentFolder: 1,
    name: 1,
    isDeleted: 1,
  },
  {
    unique: true,
  }
);

const Folder = mongoose.model("Folder", folderSchema);

export default Folder;