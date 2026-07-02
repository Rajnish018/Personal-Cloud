import Folder from "../models/folder.model.js";
import File from "../models/file.model.js";
import { minioClient } from "../config/minio.js";

const getFolderId = (req) => req.params.folderId || req.params.id;
const STORAGE_BUCKET = "users";
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

const getFolderObjectName = (userId, folderPath) => `${userId}/drive${folderPath}/`;

const folderExistsInStorage = async (folder) => {
  if (!folder?.path) return false;

  try {
    await minioClient.statObject(STORAGE_BUCKET, getFolderObjectName(folder.owner.toString(), folder.path));
    return true;
  } catch (error) {
    return false;
  }
};

const filterFoldersWithExistingStorage = async (folders) => {
  const validated = await Promise.all(
    folders.map(async (folder) => {
      if (await folderExistsInStorage(folder)) return folder;
      return null;
    })
  );

  return validated.filter(Boolean);
};

const deleteFolderObjects = async (userId, folderPath) => {
  const objectName = getFolderObjectName(userId, folderPath);
  try {
    await minioClient.removeObject(STORAGE_BUCKET, objectName);
  } catch (error) {
    // ignore missing storage objects
  }
};

const deleteFilesByPrefix = async (userId, folderPath) => {
  const escapedPath = folderPath.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const prefix = `${userId}/drive${folderPath}/`;

  const filesToDelete = await File.find({
    owner: userId,
    publicId: { $regex: `^${prefix}` },
  });

  if (!filesToDelete.length) return;

  await Promise.allSettled(
    filesToDelete.map((file) => minioClient.removeObject(STORAGE_BUCKET, file.publicId))
  );

  await File.deleteMany({ _id: { $in: filesToDelete.map((file) => file._id) } });
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

const buildFolderQueryForDescendants = (folder) => {
  const escapedPath = folder.path.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  return { path: { $regex: `^${escapedPath}(/|$)` } };
};

const getDescendantFolderIds = async (folder) => {
  const escapedPath = folder.path.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

  const folders = await Folder.find({
    owner: folder.owner,
    path: { $regex: `^${escapedPath}(/|$)` },
  }, "_id");

  return folders.map((item) => item._id);
};

const normalizeParentFolder = (parentFolder) => parentFolder || null;

const buildFolderPath = (name, parentFolder) => {
  const safeName = name.replace(/[\\/]/g, "_");

  if (!parentFolder) {
    return `/${safeName}`;
  }

  return `${parentFolder.path === "/" ? "" : parentFolder.path}/${safeName}`;
};

const createFolderPlaceholder = async (userId, folderPath) => {
  await ensureStorageBucket();

  const objectName = `${userId}/drive${folderPath}/`;

  await minioClient.putObject(
    STORAGE_BUCKET,
    objectName,
    Buffer.alloc(0),
    0,
    {
      "Content-Type": "application/x-directory",
    }
  );
};

export const createFolder = async (req, res) => {
  try {
    const { name, parentFolder = null, reuseExisting = false } = req.body;
    const normalizedParentFolder = normalizeParentFolder(parentFolder);

    if (!name?.trim()) {
      return res.status(422).json({
        success: false,
        message: "Folder name is required",
      });
    }

    let parent = null;

    if (normalizedParentFolder) {
      parent = await Folder.findOne({
        _id: normalizedParentFolder,
        owner: req.user._id,
        isDeleted: false,
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent folder not found",
        });
      }
    }

    const existingFolder = await Folder.findOne({
      owner: req.user._id,
      parentFolder: normalizedParentFolder,
      name: name.trim(),
      isDeleted: false,
    });

    if (existingFolder) {
      if (reuseExisting) {
        return res.status(200).json({
          success: true,
          message: "Folder already exists",
          folder: existingFolder,
        });
      }

      return res.status(409).json({
        success: false,
        message: "Folder already exists",
      });
    }

    const folder = await Folder.create({
      name: name.trim(),
      owner: req.user._id,
      parentFolder: normalizedParentFolder,
      path: buildFolderPath(name.trim(), parent),
    });

    try {
      await createFolderPlaceholder(req.user._id.toString(), folder.path);
    } catch (error) {
      await folder.deleteOne();
      throw error;
    }

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
    const { search, sortBy = "date", order = "desc" } = req.query;

    const query = {
      owner: req.user._id,
      parentFolder: null,
      isDeleted: false,
    };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const sortMap = {
      name: { name: order === "asc" ? 1 : -1 },
      date: { updatedAt: order === "asc" ? 1 : -1 },
    };

    const folders = await Folder.find(query).sort(sortMap[sortBy] || sortMap.date);
    const existingFolders = await filterFoldersWithExistingStorage(folders);

    return res.status(200).json({
      success: true,
      folders: existingFolders,
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
    const folderId = getFolderId(req);
    const { search, sortBy = "name", order = "asc" } = req.query;

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

    const folderQuery = {
      owner: req.user._id,
      parentFolder: folderId,
      isDeleted: false,
    };

    const fileQuery = {
      owner: req.user._id,
      $or: [
        { folder: folderId },
        { folderId },
      ],
      isDeleted: false,
    };

    if (search) {
      folderQuery.name = { $regex: search, $options: "i" };
      fileQuery.name = { $regex: search, $options: "i" };
    }

    const folderSortMap = {
      name: { name: order === "asc" ? 1 : -1 },
      date: { updatedAt: order === "asc" ? 1 : -1 },
    };

    const fileSortMap = {
      name: { name: order === "asc" ? 1 : -1 },
      size: { size: order === "asc" ? 1 : -1 },
      type: { extension: order === "asc" ? 1 : -1 },
      date: { updatedAt: order === "asc" ? 1 : -1 },
    };

    const [folders, files] = await Promise.all([
      Folder.find(folderQuery).sort(folderSortMap[sortBy] || folderSortMap.name),
      File.find(fileQuery).sort(fileSortMap[sortBy] || fileSortMap.name),
    ]);

    const existingFolders = await filterFoldersWithExistingStorage(folders);
    const existingFiles = await filterFilesWithExistingStorage(files);

    return res.status(200).json({
      success: true,
      folder,
      folders: existingFolders,
      files: existingFiles,
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
    const folderId = getFolderId(req);
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

    if (!name?.trim()) {
      return res.status(422).json({
        success: false,
        message: "Folder name is required",
      });
    }

    folder.name = name.trim();

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
    const folderId = getFolderId(req);
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
    const folderId = getFolderId(req);

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

    const now = new Date();
    const descendantFolders = await getDescendantFolderIds(folder);
    const affectedFolderIds = [folder._id, ...descendantFolders];

    await Folder.updateMany(
      {
        _id: { $in: affectedFolderIds },
        owner: req.user._id,
      },
      {
        isDeleted: true,
        deletedAt: now,
        isStarred: false,
      }
    );

    await File.updateMany(
      {
        owner: req.user._id,
        folder: { $in: affectedFolderIds },
      },
      {
        isDeleted: true,
        deletedAt: now,
        isStarred: false,
      }
    );

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
    const folderId = getFolderId(req);

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

    const update = {
      isDeleted: false,
      deletedAt: null,
    };

    const descendantFolders = await getDescendantFolderIds(folder);
    const affectedFolderIds = [folder._id, ...descendantFolders];

    await Folder.updateMany(
      {
        _id: { $in: affectedFolderIds },
        owner: req.user._id,
      },
      update
    );

    await File.updateMany(
      {
        owner: req.user._id,
        folder: { $in: affectedFolderIds },
        isDeleted: true,
      },
      update
    );

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
    const folderId = getFolderId(req);

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

    const descendantFolders = await getDescendantFolderIds(folder);
    const affectedFolderIds = [folder._id, ...descendantFolders];

    await deleteFolderObjects(req.user._id.toString(), folder.path);
    await deleteFilesByPrefix(req.user._id.toString(), folder.path);
    await Folder.deleteMany({ _id: { $in: affectedFolderIds }, owner: req.user._id });

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

export const emptyTrashFolders = async (req, res) => {
  try {
    const folders = await Folder.find({
      owner: req.user._id,
      isDeleted: true,
    }).sort({ path: -1 });

    if (folders.length) {
      await Promise.allSettled(
        folders.map((folder) =>
          deleteFolderObjects(req.user._id.toString(), folder.path)
        )
      );

      await Folder.deleteMany({
        _id: { $in: folders.map((folder) => folder._id) },
        owner: req.user._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Folder trash emptied",
      deletedCount: folders.length,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to empty folder trash",
    });
  }
};

export const getTrashFolders = async (req, res) => {
  try {
    const folders = await Folder.find({
      owner: req.user._id,
      isDeleted: true,
    }).sort({ deletedAt: -1 });

    const existingFolders = await filterFoldersWithExistingStorage(folders);

    return res.status(200).json({
      success: true,
      folders: existingFolders,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trashed folders",
    });
  }
};
