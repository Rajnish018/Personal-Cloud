import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "../api";
import { QUERY_KEYS } from "../utils/constants";

const refreshNotificationQueries = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications, exact: false });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadNotifications, exact: false });
};

export const useNotifications = (params = { page: 1, limit: 8 }) =>
  useQuery({
    queryKey: [...QUERY_KEYS.notifications, params],
    queryFn: () => notificationApi.getNotifications(params),
    staleTime: 30 * 1000,
    select: (data) => data.notifications || [],
  });

export const useUnreadNotificationCount = () =>
  useQuery({
    queryKey: QUERY_KEYS.unreadNotifications,
    queryFn: notificationApi.getUnreadCount,
    staleTime: 30 * 1000,
    select: (data) => data.unreadCount || 0,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationApi.markAsRead,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications, exact: false });

      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.notifications, exact: false },
        (old) => {
          if (!old?.notifications) return old;

          return {
            ...old,
            notifications: old.notifications.filter(
              (notification) => (notification._id || notification.id) !== notificationId
            ),
          };
        }
      );
    },
    onSuccess: () => refreshNotificationQueries(queryClient),
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notifications, exact: false });

      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.notifications, exact: false },
        (old) => {
          if (!old?.notifications) return old;

          return {
            ...old,
            notifications: [],
            total: 0,
          };
        }
      );

      queryClient.setQueryData(QUERY_KEYS.unreadNotifications, {
        success: true,
        unreadCount: 0,
      });
    },
    onSuccess: () => refreshNotificationQueries(queryClient),
  });
};

export const useClearNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationApi.clearAll,
    onSuccess: () => refreshNotificationQueries(queryClient),
  });
};
