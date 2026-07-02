import Activity from '../models/activity.model.js';

/**
 * Log a user activity.
 * @param {Object} params - Activity details.
 * @param {string} params.userId - User performing the action.
 * @param {string} params.action - Action name (upload, download, share, etc.).
 * @param {string} params.resourceType - "file" | "folder".
 * @param {string} params.resourceId - ID of the target resource.
 * @param {Object} [params.metadata] - Additional data (e.g., IP, device info).
 */
export async function logActivity({
  userId,
  action,
  resourceType,
  resourceId,
  metadata = {},
}) {
  try {
    await Activity.create({
      user: userId,
      action,
      resourceType,
      resourceId,
      metadata,
    });
  } catch (err) {
    console.error('Activity logging failed:', err);
    // Swallow error – activity logging should not block main flow
  }
}
