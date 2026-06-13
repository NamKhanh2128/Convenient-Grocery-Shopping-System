import { http } from "@/lib/httpClient";
import type { Unit } from "@/types";

export type UnitWithCount = Unit & { food_count: number };

export type UnitPayload = {
  name: string;
  symbol: string;
};

type ListResult = { success: boolean; data: { units: UnitWithCount[] } };
type DetailResult = { success: boolean; data: UnitWithCount };

export const adminUnitApi = {
  async list(params?: { search?: string }): Promise<UnitWithCount[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    const res = await http.get<ListResult>(`/api/admin/units?${qs.toString()}`);
    return res.data.units;
  },

  async getById(id: number): Promise<UnitWithCount> {
    const res = await http.get<DetailResult>(`/api/admin/units/${id}`);
    return res.data;
  },

  async create(payload: UnitPayload): Promise<UnitWithCount> {
    const res = await http.post<DetailResult>("/api/admin/units", payload);
    return res.data;
  },

  async update(id: number, payload: Partial<UnitPayload>): Promise<UnitWithCount> {
    const res = await http.put<DetailResult>(`/api/admin/units/${id}`, payload);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/api/admin/units/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await http.post("/api/admin/units/bulk-delete", { ids });
  },
};
