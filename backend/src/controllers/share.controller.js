import crypto from "crypto";
import { logActivity } from "../services/activityService.js";
import { createNotification } from "../services/notificationService.js";

import { storageClient } from "../config/storageClient.js";
import Share from "../models/share.model.js";
import File from "../models/file.model.js";
import Folder from "../models/folder.model.js";
import User from "../models/user.model.js";

const STORAGE_BUCKET = "users";

/**
 * Create a new share link for a file or a folder
 */
export const createShare = async (req, res) => {
  try {
    const {
      fileId,
      folderId,
      isPublic = true,
      permission = "view",
      expiresAt,
    } = req.body;

    if (!fileId && !folderId) {
      return res.status(400).json({
        success: false,
        message: "File ID or Folder ID is required",
      });
    }

    let resource;

    if (fileId) {
      resource = await File.findOne({
        _id: fileId,
        owner: req.user._id,
        isDeleted: false,
      });
    }

    if (folderId) {
      resource = await Folder.findOne({
        _id: folderId,
        owner: req.user._id,
        isDeleted: false,
      });
    }

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    const shareToken = crypto.randomBytes(32).toString("hex");
    const shareLink = `${process.env.CLIENT_URL}/share/${shareToken}`;

    // Aligned with the polymorphic schema definition fields
    const share = await Share.create({
      owner: req.user._id,
      resourceType: fileId ? "file" : "folder",
      resourceId: fileId || folderId,
      shareToken,
      shareLink,
      accessType: isPublic ? "public" : "private",
      permissions: [permission],
      expiresAt,
    });

    if (fileId) {
      await File.findByIdAndUpdate(fileId, {
        isShared: true,
        shared: true,
        shareLink,
      });
    }

    if (folderId) {
      await Folder.findByIdAndUpdate(folderId, {
        shared: true,
      });
    }

    // Log activity
    await logActivity({
      userId: req.user._id,
      action: "share_created",
      resourceType: fileId ? "file" : "folder",
      resourceId: fileId || folderId,
      metadata: { shareId: share._id },
    });




    // Emit real‑time notification to owner
    await createNotification({
      recipient: req.user._id,
      type: fileId ? "FILE_SHARED" : "FOLDER_SHARED",
      title: "Share Created",
      message: `You have created a share for a ${fileId ? "file" : "folder"}`,
      resourceType: fileId ? "file" : "folder",
      resourceId: fileId || folderId,
      link: shareLink,
    });

    console.log(`Share created: ${share._id} for resource ${fileId || folderId}`, shareLink);
    return res.status(201).json({
      success: true,
      message: "Share link created",
      share,
      shareUrl: shareLink,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create share link",
    });
  }
};

/**
 * Get a shared resource details via shareToken (Public route wrapper)
 */
export const getSharedResource = async (req, res) => {
  try {
    const { shareToken } = req.params;

    const share = await Share.findOne({ shareToken }).populate("owner", "name email");

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Share link not found",
      });
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(410).json({
        success: false,
        message: "Share link expired",
      });
    }

    // Dynamically query target collection based on resource metadata
    const TargetModel = share.resourceType === "file" ? File : Folder;
    const resourceDetails = await TargetModel.findOne({
      _id: share.resourceId,
      isDeleted: false,
    });

    if (!resourceDetails) {
      return res.status(404).json({
        success: false,
        message: "The original shared resource has been moved or deleted",
      });
    }

    let files = [];
    let folders = [];

    if (share.resourceType === "folder") {
      [files, folders] = await Promise.all([
        File.find({
          isDeleted: false,
          $or: [
            { folder: share.resourceId },
            { folderId: share.resourceId },
          ],
        }).sort({ name: 1 }),
        Folder.find({
          parentFolder: share.resourceId,
          isDeleted: false,
        }).sort({ name: 1 }),
      ]);
    }

    // If schema paths allow tracking analytics tracking metrics:
    if (typeof share.accessCount === "number") {
      share.accessCount += 1;
      await share.save();
    }

    return res.status(200).json({
      success: true,
      share,
      resource: resourceDetails,
      files,
      folders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to access resource",
    });
  }
};

export const downloadSharedFile = async (req, res) => {
  try {
    const { shareToken } = req.params;

    const share = await Share.findOne({ shareToken });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Share link not found",
      });
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(410).json({
        success: false,
        message: "Share link expired",
      });
    }

    if (share.resourceType !== "file") {
      return res.status(400).json({
        success: false,
        message: "Only shared files can be downloaded directly",
      });
    }

    const canDownload = (share.permissions || []).some((permission) =>
      ["download", "edit", "owner"].includes(permission)
    );

    if (!canDownload) {
      return res.status(403).json({
        success: false,
        message: "This share does not allow downloads",
      });
    }

    const file = await File.findOne({
      _id: share.resourceId,
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "The original shared file has been moved or deleted",
      });
    }

    file.downloadCount += 1;
    file.lastOpenedAt = new Date();
    await file.save();

    const downloadUrl = await storageClient.presignedGetObject(
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

/**
 * Delete / Revoke a share token
 */
export const revokeShare = async (req, res) => {
  try {
    const { shareId } = req.params;

    const share = await Share.findOne({
      _id: shareId,
      owner: req.user._id,
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Share not found",
      });
    }

    const savedResourceType = share.resourceType;
    const savedResourceId = share.resourceId;
    const savedShareToken = share.shareToken;

    await share.deleteOne();

    const remainingShares = await Share.countDocuments({
      resourceType: savedResourceType,
      resourceId: savedResourceId,
    });

    // Clean up visibility flags only when the last link for this item is removed.
    if (savedResourceType === "file" && remainingShares === 0) {
      await File.findByIdAndUpdate(savedResourceId, { isShared: false, shared: false, shareLink: null });
    } else if (savedResourceType === "folder" && remainingShares === 0) {
      await Folder.findByIdAndUpdate(savedResourceId, { shared: false });
    }

    // Log activity using safe values
    await logActivity({
      userId: req.user._id,
      action: "share_revoked",
      resourceType: savedResourceType,
      resourceId: savedResourceId,
      metadata: { shareId },
    });

    // Emit real-time notification
    await createNotification({
      recipient: req.user._id,
      type: "SHARE_REVOKED",
      title: "Share Revoked",
      message: `Your share for a ${savedResourceType} has been revoked`,
      resourceType: savedResourceType,
      resourceId: savedResourceId,
      link: `${process.env.CLIENT_URL}/share/${savedShareToken}`,
    });

    return res.status(200).json({
      success: true,
      message: "Share link revoked",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to revoke share",
    });
  }
};

/**
 * Fetch links generated by current authenticated session
 */
export const getMyShares = async (req, res) => {
  try {
    const shares = await Share.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    // Since Mongoose cannot easily cross-populate multiple collections 
    // dynamically inline, stitch together target records manually for high-quality payloads:
    const enrichedShares = await Promise.all(
      shares.map(async (share) => {
        const Model = share.resourceType === "file" ? File : Folder;
        const resource = await Model.findById(share.resourceId)
          .select("name size mimeType resourceType extension format type url createdAt updatedAt");
        return {
          ...share.toObject(),
          resource,
        };
      })
    );

    return res.status(200).json({
      success: true,
      shares: enrichedShares,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shares",
    });
  }
};

/**
 * Update permission arrays inside the token block
 */
export const updateSharePermission = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { permission } = req.body; // e.g. "edit" or "view"

    const share = await Share.findOne({
      _id: shareId,
      owner: req.user._id,
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Share not found",
      });
    }

    // Since permissions is an array of strings in your updated schema configuration:
    share.permissions = [permission];
    await share.save();

    await createNotification({
      recipient: req.user._id,
      type: "PERMISSION_CHANGED",
      title: "Share Permission Updated",
      message: `Permission changed to ${permission} for this shared ${share.resourceType}`,
      resourceType: share.resourceType,
      resourceId: share.resourceId,
      link: share.shareLink,
      metadata: { shareId },
    });

    return res.status(200).json({
      success: true,
      message: "Permission updated",
      share,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update permission",
    });
  }
};

/**
 * Route parameter injectors
 */
export const shareFileById = async (req, res) => {
  req.body.fileId = req.params.id;
  return createShare(req, res);
};

export const shareFolderById = async (req, res) => {
  req.body.folderId = req.params.id;
  return createShare(req, res);
};

/**
 * Aggregations for both specific invitations & public listings
 */
export const getSharedWithMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("email");

    const files = await File.find({
      isDeleted: false,
      "sharedWith.user": req.user._id,
    }).populate("owner", "name email");

    const folders = await Folder.find({
      isDeleted: false,
      "sharedWith.user": req.user._id,
    }).populate("owner", "name email");

    // Fetches public shares that aren't owned by the requester
    const baseShares = await Share.find({
      owner: { $ne: req.user._id },
      accessType: "public",
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    const shares = await Promise.all(
      baseShares.map(async (share) => {
        const Model = share.resourceType === "file" ? File : Folder;
        const resource = await Model.findOne({ _id: share.resourceId, isDeleted: false });
        return {
          ...share.toObject(),
          resource,
        };
      })
    );

    return res.status(200).json({
      success: true,
      userEmail: user?.email || "",
      files,
      folders,
      shares: shares.filter(s => s.resource !== null), // Clean broken items safely
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shared files",
    });
  }
};
