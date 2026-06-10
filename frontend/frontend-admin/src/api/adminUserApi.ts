import { http } from "@/lib/httpClient";
import type { User } from "@/types";

type ListResult = {
  success: boolean;
  data: {
    users: User[];
    total: number;
    page: number;
    pages: number;
  };
};

type SingleResult = { success: boolean; data: User };
type ToggleLockResult = { success: boolean; data: { user_id: string; locked: boolean }; message: string };

export const adminUserApi = {
  async list(params?: {
    search?: string;
    role?: string;
    locked?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number; page: number; pages: number }> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.role)   qs.set("role", params.role);
    if (params?.locked !== undefined) qs.set("locked", params.locked);
    if (params?.page)   qs.set("page", String(params.page));
    if (params?.limit)  qs.set("limit", String(params.limit));
    const res = await http.get<ListResult>(`/api/admin/users?${qs.toString()}`);
    return res.data;
  },

  async getById(user_id: string): Promise<User> {
    const res = await http.get<SingleResult>(`/api/admin/users/${user_id}`);
    return res.data;
  },

  async create(payload: {
    full_name: string;
    email: string;
    phone?: string;
    password: string;
    role?: string;
  }): Promise<User> {
    const res = await http.post<SingleResult>("/api/admin/users", payload);
    return res.data;
  },

  async update(user_id: string, payload: Partial<User>): Promise<User> {
    const res = await http.put<SingleResult>(`/api/admin/users/${user_id}`, payload);
    return res.data;
  },

  async toggleLock(user_id: string): Promise<{ user_id: string; locked: boolean }> {
    const res = await http.post<ToggleLockResult>(`/api/admin/users/${user_id}/toggle-lock`);
    return res.data;
  },

  async resetPassword(user_id: string, new_password: string): Promise<void> {
    await http.post(`/api/admin/users/${user_id}/reset-password`, { new_password });
  },

  async delete(user_id: string): Promise<void> {
    await http.delete(`/api/admin/users/${user_id}`);
  },

  async bulkDelete(ids: string[]): Promise<void> {
    await http.post("/api/admin/users/bulk-delete", { ids });
  },
};
