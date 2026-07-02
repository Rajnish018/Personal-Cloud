import express from 'express';
import {
  getNotificationsHandler,
  markNotificationRead,
  markAllRead,
  deleteNotificationHandler,
  clearAllHandler,
  unreadCountHandler,
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/notifications - list (supports pagination via query ?page=&limit=)
router.get('/', protect, getNotificationsHandler);

// PUT /api/notifications/read-all
router.put('/read-all', protect, markAllRead);

// PUT /api/notifications/:id/read
router.put('/:id/read', protect, markNotificationRead);

// DELETE /api/notifications/clear
router.delete('/clear', protect, clearAllHandler);

// DELETE /api/notifications/:id
router.delete('/:id', protect, deleteNotificationHandler);

// GET /api/notifications/unread-count
router.get('/unread-count', protect, unreadCountHandler);

export default router;
