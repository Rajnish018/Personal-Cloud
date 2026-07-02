import Notification from '../models/notification.model.js';
import { emitNotification } from '../socket.js';

/**
 * Create a notification and emit real‑time event.
 */
export async function createNotification({
  recipient,
  sender = null,
  type,
  title = '',
  message = '',
  resourceType = null,
  resourceId = null,
  link = null,
  metadata = {}
}) {
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    title,
    message,
    resourceType,
    resourceId,
    link,
    metadata,
  });

  // Emit to recipient via Socket.IO
  emitNotification(recipient, {
    id: notification._id,
    type,
    title,
    message,
    resourceType,
    resourceId,
    link,
    metadata,
    createdAt: notification.createdAt,
  });

  return notification;
}

/** Mark a single notification as read */
export async function markAsRead(id, userId) {
  const notification = await Notification.findOne({ _id: id, recipient: userId });
  if (!notification) throw new Error('Notification not found');
  notification.isRead = true;
  await notification.save();
  return notification;
}

/** Mark all notifications for a user as read */
export async function markAllAsRead(userId) {
  await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });
  return true;
}

/** Delete a notification */
export async function deleteNotification(id, userId) {
  const result = await Notification.deleteOne({ _id: id, recipient: userId });
  if (result.deletedCount === 0) throw new Error('Notification not found');
  return true;
}

/** Clear all notifications for a user */
export async function clearAll(userId) {
  await Notification.deleteMany({ recipient: userId });
  return true;
}

/** Get unread count */
export async function getUnreadCount(userId) {
  const count = await Notification.countDocuments({ recipient: userId, isRead: false });
  return count;
}

/** Get paginated notifications */
export async function getNotifications({ userId, page = 1, limit = 20, unread = false }) {
  const skip = (page - 1) * limit;
  const query = {
    recipient: userId,
  };

  if (unread) {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const total = await Notification.countDocuments(query);
  return { notifications, total, page, limit };
}
