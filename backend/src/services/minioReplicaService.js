import { minioClient } from "../config/minio.js";
import StorageSync from "../models/storageSync.model.js";

const bucket = process.env.MINIO_BUCKET || "users";
const RETRY_BASE_MS = 30_000;

const getContentType = (objectName = "") => {
  const extension = objectName
    .split("?")[0]
    .split(".")
    .pop()
    ?.toLowerCase();

  const types = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    avif: "image/avif",

    pdf: "application/pdf",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",

    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    oga: "audio/ogg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    flac: "audio/flac",
    opus: "audio/opus",

    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    m4v: "video/x-m4v",
    wmv: "video/x-ms-wmv",

    zip: "application/zip",
    rar: "application/vnd.rar",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",

    html: "text/html",
    css: "text/css",
    js: "text/javascript",
  };

  return types[extension] || "application/octet-stream";
};

const createObjectMetadata = (objectName, metadata = {}) => {
  return {
    "Content-Type":
      metadata["Content-Type"] ||
      metadata["content-type"] ||
      getContentType(objectName),

    "Content-Disposition":
      metadata["Content-Disposition"] ||
      metadata["content-disposition"] ||
      "inline",
  };
};

export const ensureMinioBucket = async () => {
  const exists = await minioClient.bucketExists(bucket);

  if (!exists) {
    await minioClient.makeBucket(bucket, "us-east-1");
  }

  return true;
};

export const isMinioAvailable = async () => {
  try {
    await ensureMinioBucket();
    return true;
  } catch {
    return false;
  }
};

export const queueMinioSync = async (
  objectName,
  operation,
  error = null
) => {
  await StorageSync.findOneAndUpdate(
    {
      objectName,
      operation,
    },
    {
      $set: {
        status: "PENDING",
        lastError: error?.message || String(error || ""),
        nextRetryAt: new Date(),
      },
      $setOnInsert: {
        attempts: 0,
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
};

export const replicateBufferToMinio = async (
  objectName,
  buffer,
  size,
  metadata = {}
) => {
  try {
    await ensureMinioBucket();

    const objectMetadata = createObjectMetadata(
      objectName,
      metadata
    );

    await minioClient.putObject(
      bucket,
      objectName,
      buffer,
      size ?? buffer.length,
      objectMetadata
    );

    await StorageSync.deleteOne({
      objectName,
      operation: "UPLOAD",
    });

    return {
      synced: true,
      pending: false,
    };
  } catch (error) {
    await queueMinioSync(
      objectName,
      "UPLOAD",
      error
    );

    return {
      synced: false,
      pending: true,
      error: error?.message || String(error),
    };
  }
};

export const deleteFromMinio = async (objectName) => {
  try {
    await ensureMinioBucket();

    await minioClient.removeObject(
      bucket,
      objectName
    );

    await StorageSync.deleteMany({
      objectName,
    });

    return {
      synced: true,
      pending: false,
    };
  } catch (error) {
    await queueMinioSync(
      objectName,
      "DELETE",
      error
    );

    return {
      synced: false,
      pending: true,
      error: error?.message || String(error),
    };
  }
};

const streamToBuffer = async (stream) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    );
  }

  return Buffer.concat(chunks);
};

export const processPendingMinioSync = async ({
  getMegaObject,
  limit = 20,
} = {}) => {
  if (!(await isMinioAvailable())) {
    return {
      available: false,
      processed: 0,
      failed: 0,
    };
  }

  const jobs = await StorageSync.find({
    status: {
      $in: ["PENDING", "FAILED"],
    },
    nextRetryAt: {
      $lte: new Date(),
    },
  })
    .sort({
      createdAt: 1,
    })
    .limit(limit);

  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      job.status = "SYNCING";
      job.attempts += 1;

      await job.save();

      if (job.operation === "DELETE") {
        await minioClient.removeObject(
          bucket,
          job.objectName
        );
      } else {
        if (typeof getMegaObject !== "function") {
          throw new Error(
            "getMegaObject function is required for upload synchronization"
          );
        }

        const stream = await getMegaObject(
          job.objectName
        );

        const buffer = await streamToBuffer(stream);

        const metadata = createObjectMetadata(
          job.objectName
        );

        await minioClient.putObject(
          bucket,
          job.objectName,
          buffer,
          buffer.length,
          metadata
        );
      }

      await StorageSync.deleteOne({
        _id: job._id,
      });

      processed += 1;
    } catch (error) {
      failed += 1;

      const delay = Math.min(
        RETRY_BASE_MS *
          2 ** Math.min(job.attempts, 8),
        60 * 60 * 1000
      );

      job.status = "FAILED";
      job.lastError =
        error?.message || String(error);

      job.nextRetryAt = new Date(
        Date.now() + delay
      );

      await job.save();
    }
  }

  return {
    available: true,
    processed,
    failed,
  };
};