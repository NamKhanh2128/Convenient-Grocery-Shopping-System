import { create } from "zustand";
import { db } from "@/lib/mockDb";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  isRead: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: AdminNotification[];
  initialized: boolean;
  addNotification: (notification: Omit<AdminNotification, "id" | "isRead" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  initialize: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  initialized: false,

  addNotification: (n) => {
    const newNotif: AdminNotification = {
      ...n,
      id: `notif-${Math.random().toString(36).substring(2, 9)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications],
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  },

  deleteNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  initialize: async () => {
    if (get().initialized) return;

    try {
      const state = await db();
      const list: AdminNotification[] = [];

      // 1. General System Welcome
      list.push({
        id: "sys-welcome",
        title: "Hệ thống quản trị NAT-EAT",
        message: "Hệ thống quản trị NATEAT Admin đã sẵn sàng hoạt động.",
        type: "success",
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
      });

      // 2. Add expiring/expired notifications from inventories
      const today = new Date().toISOString().slice(0, 10);
      state.fridge_items.forEach((item) => {
        const food = state.foods.find((f) => f.food_id === item.food_id);
        const family = state.families.find((f) => f.family_id === item.family_id);
        if (!food || !family) return;

        const expiryDate = item.expiry_date.slice(0, 10);
        const diffTime = new Date(expiryDate).getTime() - new Date(today).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (expiryDate < today) {
          list.push({
            id: `notif-expired-${item.fridge_item_id}`,
            title: "Thực phẩm quá hạn sử dụng!",
            message: `Hộ gia đình "${family.family_name}" có thực phẩm "${food.food_name}" (${item.location}) đã quá hạn sử dụng (${expiryDate}).`,
            type: "error",
            isRead: false,
            createdAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 mins ago
          });
        } else if (diffDays <= 4) {
          list.push({
            id: `notif-expiring-${item.fridge_item_id}`,
            title: "Thực phẩm sắp hết hạn",
            message: `Hộ gia đình "${family.family_name}" có thực phẩm "${food.food_name}" (${item.location}) sắp hết hạn sử dụng (còn lại ${diffDays} ngày).`,
            type: "warning",
            isRead: false,
            createdAt: new Date(Date.now() - 10 * 60000).toISOString(), // 10 mins ago
          });
        }
      });

      // 3. Add notifications from recent family activities
      const sortedActivities = [...state.family_activities]
        .sort((a, b) => b.created_at.localeCompare(a.created_at));

      sortedActivities.slice(0, 5).forEach((act) => {
        const user = state.users.find((u) => u.user_id === act.user_id);
        const family = state.families.find((f) => f.family_id === act.family_id);
        if (!user || !family) return;

        list.push({
          id: `notif-activity-${act.id}`,
          title: `Hoạt động gia đình: ${act.action_type === "shopping" ? "Mua sắm" : act.action_type === "fridge" ? "Tủ lạnh" : "Bữa ăn"}`,
          message: `Thành viên "${user.full_name}" của gia đình "${family.family_name}" đã ${act.message}.`,
          type: "info",
          isRead: false,
          createdAt: act.created_at,
        });
      });

      set({ notifications: list, initialized: true });
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
    }
  },
}));
