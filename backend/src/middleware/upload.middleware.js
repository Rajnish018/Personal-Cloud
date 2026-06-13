import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import cloudinary from "../config/cloudinary.js";

const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",

  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",

  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Excel
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  // PowerPoint
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Text
  "text/plain",

  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",

  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
];

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    let resourceType = "raw";

    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    }

    if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    }

    return {
      folder: "google-drive-clone",

      resource_type: resourceType,

      public_id: `${Date.now()}-${file.originalname
        .replace(/\s+/g, "-")
        .toLowerCase()}`,
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}`
      ),
      false
    );
  }
};

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

export default upload;