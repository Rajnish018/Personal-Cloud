import { randomUUID } from "crypto";

import { minioClient } from "../config/minio.js";
import File from "../models/file.model.js";
import Folder from "../models/folder.model.js";
import User from "../models/user.model.js";

const STORAGE_BUCKET = "users";
const TRASH_RETENTION_DAYS = 30;
let storageBucketReady;

const ensureStorageBucket = async () => {
  if (!storageBucketReady) {
    storageBucketReady = (async () => {
      const exists = await minioClient.bucketExists(STORAGE_BUCKET);

      if (!exists) {
        await minioClient.makeBucket(STORAGE_BUCKET, "us-east-1");
      }
    })();
  }

  try {
    await storageBucketReady;
  } catch (error) {
    storageBucketReady = null;
    throw error;
  }
};

const getResourceType = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw";
};

const createObjectName = (req, folder) => {
  const userId = req.user._id.toString();
  const safeName = req.file.originalname.replace(/[\\/]/g, "_");
  const parentPath = folder?.path || "/";
  const storagePath = parentPath === "/" ? "" : parentPath;

  return `${userId}/drive${storagePath}/${Date.now()}-${randomUUID()}-${safeName}`;
};

const normalizeFilePayload = (req, folderId, objectName) => {
  const originalName = req.file.originalname;
  const format = originalName.split(".").pop()?.toLowerCase() || "file";

  return {
    name: originalName,
    originalName,
    publicId: objectName,
    url: objectName,
    secureUrl: objectName,
    owner: req.user._id,
    folder: folderId || null,
    folderId: folderId || null,
    mimeType: req.file.mimetype,
    resourceType: getResourceType(req.file.mimetype),
    size: req.file.size,
    extension: format,
    format,
  };
};

const syncStorageUsed = async (userId) => {
  const [storage] = await File.aggregate([
    {
      $match: {
        owner: userId,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,
        used: { $sum: "$size" },
      },
    },
  ]);

  await User.findByIdAndUpdate(userId, {
    storageUsed: storage?.used || 0,
  });
};

const fileExistsInStorage = async (file) => {
  if (!file?.publicId) return false;

  try {
    await minioClient.statObject(STORAGE_BUCKET, file.publicId);
    return true;
  } catch (error) {
    return false;
  }
};

const filterFilesWithExistingStorage = async (files) => {
  const validated = await Promise.all(
    files.map(async (file) => {
      if (await fileExistsInStorage(file)) return file;
      return null;
    })
  );

  return validated.filter(Boolean);
};

const getFileId = (req) => req.params.fileId || req.params.id;

const getTrashExpiryDate = () => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - TRASH_RETENTION_DAYS);
  return expiryDate;
};

const removeFileObject = async (file) => {
  if (!file?.publicId) return;
  await minioClient.removeObject(STORAGE_BUCKET, file.publicId);
};

const permanentlyDeleteFiles = async (files) => {
  await ensureStorageBucket();

  await Promise.allSettled(files.map((file) => removeFileObject(file)));
  await File.deleteMany({ _id: { $in: files.map((file) => file._id) } });
};

const cleanupExpiredTrashFiles = async (userId) => {
  const expiredFiles = await File.find({
    owner: userId,
    isDeleted: true,
    deletedAt: { $lte: getTrashExpiryDate() },
  });

  if (!expiredFiles.length) return;

  await permanentlyDeleteFiles(expiredFiles);
  await syncStorageUsed(userId);
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { folderId: rawFolderId = null, parentFolder: rawParentFolder = null } = req.body;
    const folderId = rawFolderId || rawParentFolder;
    let parentFolder = null;

    if (folderId) {
      parentFolder = await Folder.findOne({
        _id: folderId,
        owner: req.user._id,
        isDeleted: false,
      });

      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found",
        });
      }
    }

    const objectName = createObjectName(req, parentFolder);

    await ensureStorageBucket();

    await minioClient.putObject(
      STORAGE_BUCKET,
      objectName,
      req.file.buffer,
      req.file.size,
      {
        "Content-Type": req.file.mimetype,
      }
    );

    let file;

    try {
      file = await File.create(
        normalizeFilePayload(req, folderId, objectName)
      );
    } catch (error) {
      await minioClient.removeObject(STORAGE_BUCKET, objectName);
      throw error;
    }

    await syncStorageUsed(req.user._id);

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};

export const getFiles = async (req, res) => {
  try {
    const { folderId, search, sortBy = "date", order = "desc", type } = req.query;

    const query = {
      owner: req.user._id,
      isDeleted: false,
    };

    if (folderId) {
      query.folder = folderId;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (type) {
      query.extension = type;
    }

    const sortMap = {
      name: { name: order === "asc" ? 1 : -1 },
      size: { size: order === "asc" ? 1 : -1 },
      type: { extension: order === "asc" ? 1 : -1 },
      date: { updatedAt: order === "asc" ? 1 : -1 },
    };

    const files = await File.find(query)
      .populate("folder", "name")
      .sort(sortMap[sortBy] || sortMap.date);

    const existingFiles = await filterFilesWithExistingStorage(files);

    return res.status(200).json({
      success: true,
      count: existingFiles.length,
      files: existingFiles,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch files",
    });
  }
};

export const getFile = async (req, res) => {
  try {
    const fileId = getFileId(req);

    const file = await File.findOne({
      _id: fileId,
      owner: req.user._id,
    }).populate("folder", "name");

    if (!file || !(await fileExistsInStorage(file))) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    file.lastOpenedAt = new Date();

    await file.save();

    return res.status(200).json({
      success: true,
      file,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch file",
    });
  }
};

export const renameFile = async (req, res) => {
  try {
    const fileId = getFileId(req);
    const { name } = req.body;

    const file = await File.findOne({
      _id: fileId,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    if (!name?.trim()) {
      return res.status(422).json({
        success: false,
        message: "File name is required",
      });
    }

    file.name = name.trim();

    await file.save();

    return res.status(200).json({
      success: true,
      message: "File renamed",
      file,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Rename failed",
    });
  }
};

export const moveFile = async (req, res) => {
  try {
    const fileId = getFileId(req);
    const { folderId } = req.body;

    const file = await File.findOne({
      _id: fileId,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    file.folder = folderId || null;
    file.folderId = folderId || null;

    await file.save();

    return res.status(200).json({
      success: true,
      message: "File moved",
      file,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Move failed",
    });
  }
};

export const toggleStarFile = async (
  req,
  res
) => {
  try {
    const fileId = getFileId(req);

    const file = await File.findOne({
      _id: fileId,
      owner: req.user._id,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    file.isStarred = !file.isStarred;

    await file.save();

    return res.status(200).json({
      success: true,
      file,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed",
    });
  }
};

export const deleteFile = async (
  req,
  res
) => {
  try {
    const fileId = getFileId(req);

    const file = await File.findOne({
      _id: fileId,
      owner: req.user._id,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    file.isDeleted = true;
    file.deletedAt = new Date();
    file.isStarred = false;

    await file.save();
    await syncStorageUsed(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Moved to trash",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};

export const restoreFile = async (
  req,
  res
) => {
  try {
    const fileId = getFileId(req);

    const file = await File.findOne({
      _id: fileId,
      owner: req.user._id,
      isDeleted: true,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    file.isDeleted = false;
    file.deletedAt = null;

    await file.save();
    await syncStorageUsed(req.user._id);

    return res.status(200).json({
      success: true,
      message: "File restored",
      file,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Restore failed",
    });
  }
};

export const permanentlyDeleteFile =
  async (req, res) => {
    try {
      const fileId = getFileId(req);

      const file = await File.findOne({
        _id: fileId,
        owner: req.user._id,
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      await permanentlyDeleteFiles([file]);
      await syncStorageUsed(req.user._id);

      return res.status(200).json({
        success: true,
        message:
          "File permanently deleted",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          "Permanent delete failed",
      });
    }
  };

export const emptyTrashFiles = async (req, res) => {
  try {
    const files = await File.find({
      owner: req.user._id,
      isDeleted: true,
    });

    if (files.length) {
      await permanentlyDeleteFiles(files);
      await syncStorageUsed(req.user._id);
    }

    return res.status(200).json({
      success: true,
      message: "Trash emptied",
      deletedCount: files.length,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to empty trash",
    });
  }
};

export const getRecentFiles = async (
  req,
  res
) => {
  try {
    const files = await File.find({
      owner: req.user._id,
      isDeleted: false,
    })
      .sort({ updatedAt: -1 })
      .limit(20);

    const existingFiles = await filterFilesWithExistingStorage(files);

    return res.status(200).json({
      success: true,
      files: existingFiles,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch recent files",
    });
  }
};

export const getStarredFiles = async (req, res) => {
  try {
    const files = await File.find({
      owner: req.user._id,
      isDeleted: false,
      isStarred: true,
    }).sort({ updatedAt: -1 });

    const existingFiles = await filterFilesWithExistingStorage(files);

    return res.status(200).json({
      success: true,
      files: existingFiles,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch starred files",
    });
  }
};

export const getTrashFiles = async (req, res) => {
  try {
    await cleanupExpiredTrashFiles(req.user._id);

    const files = await File.find({
      owner: req.user._id,
      isDeleted: true,
    }).sort({ deletedAt: -1 });

    const existingFiles = await filterFilesWithExistingStorage(files);

    return res.status(200).json({
      success: true,
      files: existingFiles,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trash",
    });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const fileId = getFileId(req);

    const file = await File.findOne({
      _id: fileId,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    file.downloadCount += 1;
    file.lastOpenedAt = new Date();
    await file.save();

    const downloadUrl = await minioClient.presignedGetObject(
      STORAGE_BUCKET,
      file.publicId,
      5 * 60
    );

    return res.status(200).json({
      success: true,
      downloadUrl,
      file,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to prepare download",
    });
  }
};

export const copyFile = async (req, res) => {
  try {
    const fileId = getFileId(req);

    const file = await File.findOne({
      _id: fileId,
      owner: req.user._id,
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    const copy = await File.create({
      name: `Copy of ${file.name}`,
      originalName: file.originalName,
      publicId: `${file.publicId}-copy-${Date.now()}`,
      url: file.url,
      secureUrl: file.secureUrl,
      owner: req.user._id,
      folder: file.folder,
      folderId: file.folderId,
      mimeType: file.mimeType,
      resourceType: file.resourceType,
      size: file.size,
      extension: file.extension,
      format: file.format,
    });

    await syncStorageUsed(req.user._id);

    return res.status(201).json({
      success: true,
      message: "File copied",
      file: copy,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to copy file",
    });
  }
};


export const getStorageMetrics = async (req, res) => {
  try {
    const files = await File.find({
      owner: req.user._id,
      isDeleted: false,
    })
      .populate("folder", "name path")
      .sort({ size: -1, updatedAt: -1 })
      .lean();

    const categoryDefinitions = [
      {
        key: "photos",
        label: "Photos",
        color: "bg-emerald-500",
        matches: (file) => file.resourceType === "image" || file.mimeType?.startsWith("image/"),
      },
      {
        key: "videos",
        label: "Videos",
        color: "bg-rose-500",
        matches: (file) => file.resourceType === "video" || file.mimeType?.startsWith("video/"),
      },
      {
        key: "documents",
        label: "Documents",
        color: "bg-blue-500",
        matches: (file) =>
          file.mimeType?.includes("pdf") ||
          file.mimeType?.includes("document") ||
          ["doc", "docx", "pdf", "txt", "rtf", "md"].includes(file.extension),
      },
      {
        key: "spreadsheets",
        label: "Spreadsheets",
        color: "bg-amber-500",
        matches: (file) =>
          file.mimeType?.includes("spreadsheet") ||
          file.mimeType?.includes("excel") ||
          ["csv", "xls", "xlsx"].includes(file.extension),
      },
      {
        key: "other",
        label: "Other",
        color: "bg-slate-400",
        matches: () => true,
      },
    ];

    const fileTypeFor = (file) =>
      categoryDefinitions.find((category) => category.matches(file))?.key || "other";

    const categoryMap = categoryDefinitions.reduce((accumulator, category) => {
      accumulator[category.key] = {
        key: category.key,
        label: category.label,
        color: category.color,
        count: 0,
        sizeBytes: 0,
      };
      return accumulator;
    }, {});

    const normalizedFiles = files.map((file) => {
      const typeGroup = fileTypeFor(file);
      categoryMap[typeGroup].count += 1;
      categoryMap[typeGroup].sizeBytes += file.size || 0;

      return {
        ...file,
        typeGroup,
        location: file.folder?.path || file.folder?.name || "/",
      };
    });

    const usedSpaceBytes = normalizedFiles.reduce((total, file) => total + (file.size || 0), 0);
    const categories = Object.values(categoryMap).filter((category) => category.count > 0);

    const metrics = {
      totalFiles: normalizedFiles.length,
      totalSize: usedSpaceBytes,
      usedSpaceBytes,
      totalSpaceBytes: req.user.storageLimit || 0,
      categories,
      files: normalizedFiles,
      largeFiles: normalizedFiles.slice(0, 20),
    };

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch storage metrics",
    });
  }
};
