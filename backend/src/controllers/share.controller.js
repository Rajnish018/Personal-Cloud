import crypto from "crypto";

import Share from "../models/share.model.js";
import File from "../models/file.model.js";
import Folder from "../models/folder.model.js";

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

    const shareToken =
      crypto.randomBytes(32).toString("hex");

    const share = await Share.create({
      file: fileId || null,
      folder: folderId || null,
      owner: req.user._id,
      shareToken,
      isPublic,
      permission,
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      message: "Share link created",
      share,
      shareUrl: `${process.env.CLIENT_URL}/share/${shareToken}`,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create share link",
    });
  }
};

export const getSharedResource = async (
  req,
  res
) => {
  try {
    const { shareToken } = req.params;

    const share = await Share.findOne({
      shareToken,
    })
      .populate("file")
      .populate("folder");

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Share link not found",
      });
    }

    if (
      share.expiresAt &&
      new Date() > share.expiresAt
    ) {
      return res.status(410).json({
        success: false,
        message: "Share link expired",
      });
    }

    share.accessCount += 1;

    await share.save();

    return res.status(200).json({
      success: true,
      share,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to access resource",
    });
  }
};

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

    await share.deleteOne();

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

export const getMyShares = async (
  req,
  res
) => {
  try {
    const shares = await Share.find({
      owner: req.user._id,
    })
      .populate("file")
      .populate("folder")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      shares,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shares",
    });
  }
};

export const updateSharePermission =
  async (req, res) => {
    try {
      const { shareId } = req.params;

      const { permission } = req.body;

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

      share.permission = permission;

      await share.save();

      return res.status(200).json({
        success: true,
        message: "Permission updated",
        share,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          "Failed to update permission",
      });
    }
  };