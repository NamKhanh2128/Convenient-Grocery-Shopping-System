import { http } from "@/lib/httpClient";
import type { FamilyGroup } from "@/types";

export type FamilyWithMembers = FamilyGroup & {
  members: {
    id: number;
    user_id: number;
    full_name?: string;
    email?: string;
    role?: string;
  }[];
  creator_name?: string;
  creator_email?: string;
  member_count?: number;
};

type FamilyListResult = { success: boolean; data: { families: FamilyWithMembers[] } };
type MembersResult = { success: boolean; data: { members: FamilyWithMembers["members"] } };

export const adminFamilyApi = {
  async list(): Promise<FamilyWithMembers[]> {
    const res = await http.get<FamilyListResult>("/api/admin/families");
    return res.data.families;
  },

  async getMembers(family_id: number): Promise<FamilyWithMembers["members"]> {
    const res = await http.get<MembersResult>(`/api/admin/families/${family_id}/members`);
    return res.data.members;
  },

  async delete(family_id: number): Promise<void> {
    await http.delete(`/api/admin/families/${family_id}`);
  },
};
