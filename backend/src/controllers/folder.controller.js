import Folder from "../models/folder.model.js";
import File from "../models/file.model.js";

export const createFolder = async (req, res) => {
  try {
    const { name, parentFolder = null } = req.body;

    const existingFolder = await Folder.findOne({
      owner: req.user._id,
      parentFolder,
      name,
      isDeleted: false,
    });

    if (existingFolder) {
      return res.status(409).json({
        success: false,
        message: "Folder already exists",
      });
    }

    const folder = await Folder.create({
      name,
      owner: req.user._id,
      parentFolder,
    });

    return res.status(201).json({
      success: true,
      message: "Folder created successfully",
      folder,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create folder",
    });
  }
};

export const getRootFolders = async (req, res) => {
  try {
    const folders = await Folder.find({
      owner: req.user._id,
      parentFolder: null,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      folders,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch folders",
    });
  }
};

export const getFolderContents = async (req, res) => {
  try {
    const { folderId } = req.params;

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

    const folders = await Folder.find({
      owner: req.user._id,
      parentFolder: folderId,
      isDeleted: false,
    });

    const files = await File.find({
      owner: req.user._id,
      folder: folderId,
      isDeleted: false,
    });

    return res.status(200).json({
      success: true,
      folder,
      folders,
      files,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contents",
    });
  }
};

export const renameFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name } = req.body;

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

    folder.name = name;

    await folder.save();

    return res.status(200).json({
      success: true,
      message: "Folder renamed successfully",
      folder,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to rename folder",
    });
  }
};

export const moveFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { parentFolder } = req.body;

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

    folder.parentFolder = parentFolder || null;

    await folder.save();

    return res.status(200).json({
      success: true,
      message: "Folder moved successfully",
      folder,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to move folder",
    });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user._id,
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    folder.isDeleted = true;
    folder.deletedAt = new Date();

    await folder.save();

    return res.status(200).json({
      success: true,
      message: "Folder moved to trash",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete folder",
    });
  }
};

export const restoreFolder = async (req, res) => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user._id,
      isDeleted: true,
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    folder.isDeleted = false;
    folder.deletedAt = null;

    await folder.save();

    return res.status(200).json({
      success: true,
      message: "Folder restored",
      folder,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to restore folder",
    });
  }
};

export const permanentlyDeleteFolder = async (
  req,
  res
) => {
  try {
    const { folderId } = req.params;

    const folder = await Folder.findOne({
      _id: folderId,
      owner: req.user._id,
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    await Folder.findByIdAndDelete(folderId);

    return res.status(200).json({
      success: true,
      message: "Folder permanently deleted",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete folder",
    });
  }
};