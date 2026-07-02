import apiClient from "./apiClient";

export const notificationApi = {
  getNotifications: (params = {}) => apiClient.get("/notifications", { params }),
  getUnreadCount: () => apiClient.get("/notifications/unread-count"),
  markAsRead: (notificationId) => apiClient.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => apiClient.put("/notifications/read-all"),
  deleteNotification: (notificationId) => apiClient.delete(`/notifications/${notificationId}`),
  clearAll: () => apiClient.delete("/notifications/clear"),
};
