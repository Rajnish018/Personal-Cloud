import { v2 as cloudinary } from "cloudinary";

import File from "../models/file.model.js";
import Folder from "../models/folder.model.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { folderId } = req.body;

    if (folderId) {
      const folder = await Folder.findOne({
        _id: folderId,
        owner: req.user._id,
        isDeleted: false,
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found",
        });
      }
    }

    const file = await File.create({
      name: req.file.originalname,
      publicId: req.file.filename,
      url: req.file.path,
      owner: req.user._id,
      folder: folderId || null,
      mimeType: req.file.mimetype,
      resourceType: req.file.resource_type,
      size: req.file.size,
      extension:
        req.file.originalname.split(".").pop(),
    });

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
    const { folderId } = req.query;

    const query = {
      owner: req.user._id,
      isDeleted: false,
    };

    if (folderId) {
      query.folder = folderId;
    }

    const files = await File.find(query)
      .populate("folder", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: files.length,
      files,
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
    const { fileId } = req.params;

    const file = await File.findOne({
      _id: fileId,
      owner: req.user._id,
    }).populate("folder", "name");

    if (!file) {
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
    const { fileId } = req.params;
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

    file.name = name;

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
    const { fileId } = req.params;
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
    const { fileId } = req.params;

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
    const { fileId } = req.params;

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

    await file.save();

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
    const { fileId } = req.params;

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
      const { fileId } = req.params;

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

      await cloudinary.uploader.destroy(
        file.publicId,
        {
          resource_type:
            file.resourceType || "raw",
        }
      );

      await file.deleteOne();

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

    return res.status(200).json({
      success: true,
      files,
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