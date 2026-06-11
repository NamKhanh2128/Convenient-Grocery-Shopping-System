import { http } from "@/lib/httpClient";
import type { Notification } from "@/types";

/**
 * adminNotificationApi
 *
 * Operates only on schema-defined fields for the `notifications` table:
 *   id, user_id, type, title, message, is_read, related_id, created_at
 *
 * The joined `user_name` and `user_email` fields are view-only projections
 * returned by the backend JOIN — they are NOT schema columns and are never
 * written back to the database.
 */

export interface NotificationWithUser extends Notification {
  /** Joined from users.full_name — read-only display field */
  user_name: string | null;
  /** Joined from users.email — read-only display field */
  user_email: string | null;
}

export interface NotificationListResult {
  notifications: NotificationWithUser[];
  total: number;
}

export interface NotificationListParams {
  search?: string;
  /** Notification type: e.g. 'expiration', 'shopping_update' */
  type?: string;
  /** Filter by read status: 'true' | 'false' */
  is_read?: string;
  limit?: number;
  offset?: number;
}

type ListResponse = { success: boolean; data: NotificationListResult };
type DetailResponse = { success: boolean; data: NotificationWithUser };
type ActionResponse = { success: boolean; message: string };

export const adminNotificationApi = {
  /**
   * List notifications with optional search, type, is_read, limit, offset.
   */
  async list(params?: NotificationListParams): Promise<NotificationListResult> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.type) qs.set("type", params.type);
    if (params?.is_read !== undefined) qs.set("is_read", params.is_read);
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    const res = await http.get<ListResponse>(`/api/admin/notifications?${qs.toString()}`);
    return res.data;
  },

  /**
   * Get a single notification by id.
   */
  async getById(id: number): Promise<NotificationWithUser> {
    const res = await http.get<DetailResponse>(`/api/admin/notifications/${id}`);
    return res.data;
  },

  /**
   * Mark a single notification as read (is_read = true).
   */
  async markAsRead(id: number): Promise<NotificationWithUser> {
    const res = await http.patch<DetailResponse>(`/api/admin/notifications/${id}/read`);
    return res.data;
  },

  /**
   * Mark multiple notifications as read.
   */
  async bulkMarkAsRead(ids: number[]): Promise<void> {
    await http.post<ActionResponse>("/api/admin/notifications/bulk-read", { ids });
  },

  /**
   * Mark all notifications as read (optionally scoped to a user).
   */
  async markAllAsRead(user_id?: number): Promise<void> {
    await http.post<ActionResponse>("/api/admin/notifications/mark-all-read", user_id ? { user_id } : {});
  },

  /**
   * Delete a single notification.
   */
  async delete(id: number): Promise<void> {
    await http.delete(`/api/admin/notifications/${id}`);
  },

  /**
   * Bulk delete notifications by ID list.
   */
  async bulkDelete(ids: number[]): Promise<void> {
    await http.post<ActionResponse>("/api/admin/notifications/bulk-delete", { ids });
  },
};
