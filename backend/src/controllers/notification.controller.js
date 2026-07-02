import {
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
  getUnreadCount,
  getNotifications,
} from '../services/notificationService.js';

/** GET /api/notifications - list paginated notifications */
export const getNotificationsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, unread } = req.query;
    const result = await getNotifications({
      userId,
      page: Number(page),
      limit: Number(limit),
      unread: unread === "true",
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/notifications/:id/read */
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const notification = await markAsRead(id, userId);
    res.json({ success: true, notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/notifications/read-all */
export const markAllRead = async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /api/notifications/:id */
export const deleteNotificationHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteNotification(id, req.user.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/** DELETE /api/notifications/clear */
export const clearAllHandler = async (req, res) => {
  try {
    await clearAll(req.user.id);
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/notifications/unread-count */
export const unreadCountHandler = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    res.json({ success: true, unreadCount: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
