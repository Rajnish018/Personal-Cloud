import Share from '../models/share.model.js';
import mongoose from 'mongoose';

/**
 * Helper to fetch share document and verify that the requesting user has a specific permission.
 * @param {string} shareId - The Share document _id.
 * @param {string} userId - The requesting user's ObjectId.
 * @param {string} required - Permission required (view|edit|download|comment|owner).
 * @returns {Promise<Share>} - The share document if permission granted.
 */
async function getShareWithPermission(shareId, userId, required) {
  if (!mongoose.Types.ObjectId.isValid(shareId)) {
    const err = new Error('Invalid share identifier');
    err.status = 400;
    throw err;
  }
  const share = await Share.findById(shareId).lean();
  if (!share) {
    const err = new Error('Share not found');
    err.status = 404;
    throw err;
  }

  // Owner always has all permissions
  if (share.owner.toString() === userId.toString()) return share;

  // Direct collaborator list
  const collaborator = (share.sharedWith || []).find(
    (c) => c.user && c.user.toString() === userId.toString()
  );
  if (!collaborator) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }

  const perms = collaborator.permission ? [collaborator.permission] : [];
  // owner permission is a special string in the enum
  if (perms.includes('owner')) return share;

  const map = {
    canView: ['view', 'owner'],
    canEdit: ['edit', 'owner'],
    canDownload: ['download', 'view', 'owner'],
    canComment: ['comment', 'owner'],
    isOwner: ['owner'],
  };

  const allowed = map[required] || [];
  if (allowed.some((p) => perms.includes(p))) return share;
  const err = new Error('Insufficient permission');
  err.status = 403;
  throw err;
}

export const checkSharePermission = (action) => {
  return async (req, res, next) => {
    try {
      const shareId = req.params.id || req.body.shareId || req.query.shareId;
      const userId = req.user && req.user.id;
      if (!shareId || !userId) {
        return res.status(400).json({ message: 'Missing shareId or authentication' });
      }
      await getShareWithPermission(shareId, userId, action);
      next();
    } catch (e) {
      const status = e.status || 500;
      res.status(status).json({ message: e.message });
    }
  };
};

// Export convenience middlewares
export const canView = checkSharePermission('canView');
export const canEdit = checkSharePermission('canEdit');
export const canDownload = checkSharePermission('canDownload');
export const canComment = checkSharePermission('canComment');
export const isOwner = checkSharePermission('isOwner');
