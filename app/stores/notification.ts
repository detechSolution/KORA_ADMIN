import { defineStore } from "pinia";
import { ref } from "vue";

import type { ApiResponse } from "~/types/api";

import { getHttp } from "~/composables/use-api";
import { API_ENDPOINTS } from "~/config/constants";
import { buildQueryString } from "~/utils/common";

export type Notification = {
  id: number;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  [key: string]: unknown;
};

type FetchNotificationsParams = {
  page?: number;
  limit?: number;
  unreadOnly?: "unread" | "read";
};

type FetchNotificationsOptions = {
  append?: boolean;
};

export const useNotificationStore = defineStore("notification", () => {
  const http = getHttp();
  const notifications = ref<ApiResponse<Notification[]>>({
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 10,
    },
  });
  const unreadCount = ref(0);
  const loading = ref(false);

  const fetchNotifications = async (
    params?: FetchNotificationsParams,
    options: FetchNotificationsOptions = {},
  ) => {
    loading.value = true;
    try {
      const qs = buildQueryString({ page: 1, limit: 10, ...params });
      const response = await http.get(
        `${API_ENDPOINTS.NOTIFICATION.BASE}?${qs}`,
      ) as ApiResponse<Notification[]>;

      if (options.append) {
        const existingIds = new Set(notifications.value.data.map(item => item.id));
        const nextData = response.data.filter(item => !existingIds.has(item.id));

        notifications.value = {
          ...response,
          data: [...notifications.value.data, ...nextData],
        };
        return;
      }

      notifications.value = response;
    }
    catch (error: unknown) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
    finally {
      loading.value = false;
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await http.get(API_ENDPOINTS.NOTIFICATION.GET_UNREAD_COUNT) as any;
      unreadCount.value = response?.count ?? response?.unreadCount ?? 0;
    }
    catch (error: unknown) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await http.patch(API_ENDPOINTS.NOTIFICATION.READ(id), {});
      const item = notifications.value.data.find(n => n.id === id);
      if (item && !item.read) {
        item.read = true;
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    }
    catch (error: unknown) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      await http.patch(API_ENDPOINTS.NOTIFICATION.READ_ALL, {});
      notifications.value.data.forEach((n) => {
        n.read = true;
      });
      unreadCount.value = 0;
    }
    catch (error: unknown) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  };

  const registerDevice = async (payload: { token: string; platform: string }) => {
    try {
      await http.post(API_ENDPOINTS.NOTIFICATION.POST_DEVICE, payload);
    }
    catch (error: unknown) {
      console.error("Error registering device:", error);
      throw error;
    }
  };

  const removeDevice = async (deviceId: string) => {
    try {
      await http.delete(API_ENDPOINTS.NOTIFICATION.DELETE_DEVICE(deviceId));
    }
    catch (error: unknown) {
      console.error("Error removing device:", error);
      throw error;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    registerDevice,
    removeDevice,
  };
});
