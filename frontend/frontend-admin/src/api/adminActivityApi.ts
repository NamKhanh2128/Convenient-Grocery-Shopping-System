import { http } from "@/lib/httpClient";
import type { FamilyActivity } from "@/types";

export type FamilyActivityWithDetails = FamilyActivity & {
  user_name?: string;
  user_email?: string;
  user_role?: string;
  family_name?: string;
};

type ActivityListResult = {
  success: boolean;
  data: {
    activities: FamilyActivityWithDetails[];
    total: number;
  };
};

export const adminActivityApi = {
  async list(params?: {
    search?: string;
    action_type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ activities: FamilyActivityWithDetails[]; total: number }> {
    const qs = new URLSearchParams();
    if (params?.search)      qs.set("search", params.search);
    if (params?.action_type) qs.set("action_type", params.action_type);
    if (params?.page)        qs.set("page", String(params.page));
    if (params?.limit)       qs.set("limit", String(params.limit));
    const res = await http.get<ActivityListResult>(`/api/admin/activities?${qs.toString()}`);
    return res.data;
  },
};
