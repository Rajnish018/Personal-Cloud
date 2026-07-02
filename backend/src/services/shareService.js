import crypto from "crypto";
import Share from "../models/share.model.js";
import File from "../models/file.model.js";
import Folder from "../models/folder.model.js";
import { emitNotification } from "../socket.js";
import { emitNotificationEvent } from "../socket.js";

/**
 * Generate a secure random token for share links.
 */
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a new share for a file or folder.
 * Returns the Share document.
 */
export async function createShare({
  ownerId,
  resourceType,
  resourceId,
  isPublic = false,
  accessType = "private",
  permissions = ["view"],
  passwordProtected = false,
  password = null,
  expiresAt = null,
  allowDownload = true,
  allowCopy = true,
}) {
  // Validate resource existence
  if (resourceType === "file") {
    const file = await File.findById(resourceId);
    if (!file) throw new Error("File not found");
  } else if (resourceType === "folder") {
    const folder = await Folder.findById(resourceId);
    if (!folder) throw new Error("Folder not found");
  } else {
    throw new Error("Invalid resource type");
  }

  const shareToken = generateToken();
  const shareLink = `${process.env.CLIENT_URL}/share/${shareToken}`;

  const share = await Share.create({
    owner: ownerId,
    resourceType,
    resourceId,
    shareToken,
    shareLink,
    accessType,
    permissions,
    passwordProtected,
    password,
    expiresAt,
    allowDownload,
    allowCopy,
    isPublic,
  });

  // Emit real‑time notification to the owner (optional)
  emitNotification(ownerId, {
    type: "FILE_SHARED",
    title: "Share created",
    message: `You created a share for ${resourceType}`,
    resourceType,
    resourceId,
    link: shareLink,
  });

  return share;
}

/**
 * Retrieve a share by its token, enforcing expiry.
 */
export async function getShareByToken(token) {
  const share = await Share.findOne({ shareToken: token })
    .populate("owner", "email name")
    .lean();
  if (!share) throw new Error("Share not found");
  if (share.expiresAt && new Date() > share.expiresAt) {
    throw new Error("Share expired");
  }
  // Increment access counter
  await Share.updateOne({ _id: share._id }, { $inc: { accessCount: 1 } });
  return share;
}

/**
 * Revoke (delete) a share. Only the owner can revoke.
 */
export async function revokeShare({ shareId, requesterId }) {
  const share = await Share.findOne({ _id: shareId, owner: requesterId });
  if (!share) throw new Error("Share not found or insufficient permissions");
  await share.deleteOne();
  // Notify owner of revocation
  emitNotificationEvent(requesterId, "notification:share-revoked", { shareId });
}

/**
 * Add a collaborator to an existing share.
 */
export async function addCollaborator({ shareId, userId, permission }) {
  const share = await Share.findById(shareId);
  if (!share) throw new Error("Share not found");
  // Prevent duplicate entries
  const exists = share.sharedWith.some((c) => c.user.toString() === userId);
  if (exists) throw new Error("User already a collaborator");
  share.sharedWith.push({ user: userId, permission });
  await share.save();
  emitNotification(userId, {
    type: "SHARE_ACCEPTED",
    title: "You have been added to a share",
    resourceType: share.resourceType,
    resourceId: share.resourceId,
    link: share.shareLink,
  });
  return share;
}

/**
 * Remove a collaborator from a share.
 */
export async function removeCollaborator({ shareId, userId }) {
  const share = await Share.findById(shareId);
  if (!share) throw new Error("Share not found");
  share.sharedWith = share.sharedWith.filter(
    (c) => c.user.toString() !== userId
  );
  await share.save();
  emitNotification(userId, {
    type: "SHARE_REVOKED",
    title: "Your access was removed",
    resourceType: share.resourceType,
    resourceId: share.resourceId,
  });
  return share;
}

/**
 * Transfer ownership of a share to another user.
 */
export async function transferOwnership({ shareId, newOwnerId }) {
  const share = await Share.findById(shareId);
  if (!share) throw new Error("Share not found");
  const oldOwner = share.owner;
  share.owner = newOwnerId;
  await share.save();
  // Notify both parties
  emitNotification(oldOwner, {
    type: "PERMISSION_CHANGED",
    title: "Share ownership transferred",
    resourceId: share.resourceId,
  });
  emitNotification(newOwnerId, {
    type: "SHARE_ACCEPTED",
    title: "You are now the owner of a share",
    resourceId: share.resourceId,
  });
  return share;
}

/**
 * Get shares created by a specific user.
 */
export async function getSharesByOwner(ownerId) {
  return Share.find({ owner: ownerId })
    .populate("resourceId")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get shares where the user is a collaborator (shared with me).
 */
export async function getSharesWithUser(userId) {
  return Share.find({ "sharedWith.user": userId })
    .populate("owner", "name email")
    .populate("resourceId")
    .sort({ createdAt: -1 })
    .lean();
}
