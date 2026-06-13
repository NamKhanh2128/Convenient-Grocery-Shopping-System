import { create } from "zustand";
import { adminNotificationApi } from "@/api/adminNotificationApi";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  isRead: boolean;
  createdAt: string;
}

function mapNotificationType(type: string): AdminNotification["type"] {
  if (type.includes("expir") || type.includes("error")) return "error";
  if (type.includes("warn")) return "warning";
  if (type.includes("success") || type.includes("complete")) return "success";
  return "info";
}

interface NotificationStore {
  notifications: AdminNotification[];
  initialized: boolean;
  initialize: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    try {
      const { notifications } = await adminNotificationApi.list({ limit: 15, offset: 0 });
      set({
        notifications: notifications.map((n) => ({
          id: String(n.id),
          title: n.title,
          message: n.message,
          type: mapNotificationType(n.type),
          isRead: Boolean(n.is_read),
          createdAt: n.created_at ?? new Date().toISOString(),
        })),
        initialized: true,
      });
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  },

  markAsRead: async (id) => {
    try {
      await adminNotificationApi.markAsRead(Number(id));
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      }));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await adminNotificationApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      }));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await adminNotificationApi.delete(Number(id));
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  },
}));
