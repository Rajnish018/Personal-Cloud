import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    // Original file name
    name: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
      maxlength: [255, "File name cannot exceed 255 characters"],
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    // Cloudinary public id
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Cloudinary secure URL
    url: {
      type: String,
      required: true,
    },
    secureUrl: {
      type: String,
      required: true,
    },

    // File owner
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Parent folder
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },

    // MIME type
    mimeType: {
      type: String,
      required: true,
    },

    // image | video | raw
    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      required: true,
    },

    // Size in bytes
    size: {
      type: Number,
      required: true,
      min: 0,
    },

    // File extension
    extension: {
      type: String,
      required: true,
      lowercase: true,
    },
    format: {
      type: String,
      required: true,
      lowercase: true,
    },

    // Favorite
    isStarred: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Trash
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    // Sharing
    shared: {
      type: Boolean,
      default: false,
    },
    isShared: {
      type: Boolean,
      default: false,
      index: true,
    },

    shareLink: {
      type: String,
      default: null,
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

    // Activity
    lastOpenedAt: {
      type: Date,
      default: null,
    },

    downloadCount: {
      type: Number,
      default: 0,
    },

    // Versioning (future)
    version: {
      type: Number,
      default: 1,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Fast Queries
 */
fileSchema.index({
  owner: 1,
  folder: 1,
  isDeleted: 1,
});

fileSchema.index({
  owner: 1,
  isStarred: 1,
});

fileSchema.index({
  name: "text",
});

/**
 * Virtual
 */
fileSchema.virtual("sizeInMB").get(function () {
  return (this.size / (1024 * 1024)).toFixed(2);
});

const File = mongoose.model("File", fileSchema);

export default File;
