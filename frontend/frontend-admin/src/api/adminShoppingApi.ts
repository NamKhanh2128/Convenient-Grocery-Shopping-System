import { http } from "@/lib/httpClient";
import type { ShoppingList, ShoppingListItem } from "@/types";

export interface ShoppingListSummary extends ShoppingList {
  user_name: string | null;
  user_email: string | null;
  assigned_user_name: string | null;
  group_name: string | null;
  item_count: number;
  purchased_count: number;
}

export interface ShoppingListItemWithMeta extends ShoppingListItem {
  unit_name: string | null;
  unit_symbol: string | null;
  category_name_vi: string | null;
  category_name_en: string | null;
  purchased_by_name: string | null;
}

export interface ShoppingListWithItems extends ShoppingListSummary {
  items: ShoppingListItemWithMeta[];
}

export type ShoppingListUpdatePayload = {
  name?: string;
  status?: string | null;
  plan_date?: string | null;
  assigned_user_id?: number | null;
};

export type ShoppingItemUpdatePayload = {
  is_purchased?: boolean;
  item_status?: string | null;
  bought_quantity?: number | null;
  remaining_quantity?: number | null;
};

export interface ShoppingUser {
  id: number;
  full_name: string;
  email: string;
}

type ListResult = { success: boolean; data: { lists: ShoppingListSummary[] } };
type DetailResult = { success: boolean; data: ShoppingListWithItems };
type UsersResult = { success: boolean; data: { users: ShoppingUser[] } };

export const adminShoppingApi = {
  async list(params?: { search?: string; status?: string }): Promise<ShoppingListSummary[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    const res = await http.get<ListResult>(`/api/admin/shopping-lists?${qs.toString()}`);
    return res.data.lists;
  },

  async getById(id: number): Promise<ShoppingListWithItems> {
    const res = await http.get<DetailResult>(`/api/admin/shopping-lists/${id}`);
    return res.data;
  },

  async update(id: number, payload: ShoppingListUpdatePayload): Promise<ShoppingListWithItems> {
    const res = await http.put<DetailResult>(`/api/admin/shopping-lists/${id}`, payload);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/api/admin/shopping-lists/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await http.post("/api/admin/shopping-lists/bulk-delete", { ids });
  },

  async updateItem(listId: number, itemId: number, payload: ShoppingItemUpdatePayload): Promise<ShoppingListWithItems> {
    const res = await http.put<DetailResult>(`/api/admin/shopping-lists/${listId}/items/${itemId}`, payload);
    return res.data;
  },

  async deleteItem(listId: number, itemId: number): Promise<ShoppingListWithItems> {
    const res = await http.delete<DetailResult>(`/api/admin/shopping-lists/${listId}/items/${itemId}`);
    return res.data;
  },

  async getUsers(): Promise<ShoppingUser[]> {
    const res = await http.get<UsersResult>(`/api/admin/shopping-lists/meta/users`);
    return res.data.users;
  },
};
