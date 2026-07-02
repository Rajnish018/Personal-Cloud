import multer from "multer";

const ALLOWED_MIME_TYPES = [

  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",

  "video/mp4",
  "video/webm",

  "application/pdf",

  "text/plain",

  "application/zip",

  "audio/mpeg",
];

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

  storage: multer.memoryStorage(),

  fileFilter,

  limits: {
    fileSize: 100 * 1024 * 1024,
  },

});

export default upload;