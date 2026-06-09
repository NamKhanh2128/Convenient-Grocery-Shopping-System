import type { Family, FamilyActivity, User } from "@/types";

function normalizeApiOrigin(value?: string) {
  return (value || "http://localhost:3000").replace(/\/api\/?$/, "");
}

const API_BASE_URL = normalizeApiOrigin(import.meta.env.VITE_API_BASE_URL);
const ACCESS_TOKEN_KEY = "nateat.token";

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type FamilyDto = {
  id?: string;
  name?: string;
  code?: string;
  createdAt?: string;
  family_id?: string;
  family_name?: string;
  family_code?: string;
  created_at?: string;
};

export type SentFamilyInvitation = {
  id: number;
  invitationId: number;
  groupId: string;
  invitedUserId: string;
  status: string;
  createdAt: string;
  email: string;
  fullName: string;
};

export type ReceivedFamilyInvitation = {
  id: number;
  invitationId: number;
  groupId: string;
  status: string;
  createdAt: string;
  familyName: string;
  familyCode: string;
  inviterName: string;
};

function getToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const method = options.method ?? "GET";
  const isGet = method.toUpperCase() === "GET";
  const cacheBustedPath = isGet
    ? `${path}${path.includes("?") ? "&" : "?"}t=${Date.now()}`
    : path;

  const response = await fetch(`${API_BASE_URL}${cacheBustedPath}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok || payload.success === false) {
    const message =
      payload.message === "Transfer admin role before leaving this family"
        ? "Bạn cần nhường quyền quản trị trước khi rời gia đình."
        : payload.message || "Khong the ket noi toi may chu.";
    throw new Error(message);
  }

  return payload.data;
}

function normalizeFamily(data: FamilyDto | null): Family | null {
  if (!data) return null;
  return {
    family_id: String(data.family_id ?? data.id),
    family_name: String(data.family_name ?? data.name ?? ""),
    family_code: data.family_code ?? data.code,
    created_at: data.created_at ?? data.createdAt,
  };
}

export const familyApi = {
  endpoint: "/api/family",
  async me(): Promise<Family | null> {
    return normalizeFamily(await request<FamilyDto | null>("/api/family/me"));
  },
  async members(): Promise<User[]> {
    return request<User[]>("/api/family/members");
  },
  async detail(_family_id?: string): Promise<{ family: Family; members: User[]; activities: FamilyActivity[] }> {
    const [family, members] = await Promise.all([this.me(), this.members()]);
    if (!family) throw new Error("Ban chua tham gia gia dinh nao.");
    return { family, members, activities: [] };
  },
  async rename(_family_id: string, family_name: string) {
    const family = normalizeFamily(
      await request<FamilyDto>("/api/family/me", {
        method: "PATCH",
        body: JSON.stringify({ name: family_name }),
      })
    );
    if (!family) throw new Error("Khong tim thay gia dinh.");
    return family;
  },
  async addMember(_family_id: string, email: string) {
    return request<SentFamilyInvitation>("/api/family/members", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async addMemberById(_family_id: string, user_id: string) {
    const data = await request<{ member: User }>("/api/family/members", {
      method: "POST",
      body: JSON.stringify({ user_id }),
    });
    return data.member;
  },
  async removeMember(_family_id: string, user_id: string) {
    await request<null>(`/api/family/members/${encodeURIComponent(user_id)}`, { method: "DELETE" });
  },
  async joinFamilyById(family_code: string, _user_id?: string) {
    const family = normalizeFamily(
      await request<FamilyDto>("/api/family/join", {
        method: "POST",
        body: JSON.stringify({ code: family_code }),
      })
    );
    if (!family) throw new Error("Khong the tham gia gia dinh.");
    return family;
  },
  async createFamily(family_name: string, _user_id?: string) {
    const family = normalizeFamily(
      await request<FamilyDto>("/api/family", {
        method: "POST",
        body: JSON.stringify({ name: family_name }),
      })
    );
    if (!family) throw new Error("Khong the tao gia dinh.");
    return family;
  },
  async leaveFamily() {
    await request<null>("/api/family/leave", { method: "DELETE" });
  },
  async sentInvitations() {
    return request<SentFamilyInvitation[]>("/api/family/invitations/sent");
  },
  async receivedInvitations() {
    return request<ReceivedFamilyInvitation[]>("/api/family/invitations/received");
  },
  async acceptInvitation(invitationId: number | string) {
    const family = normalizeFamily(
      await request<FamilyDto>(`/api/family/invitations/${encodeURIComponent(String(invitationId))}/accept`, {
        method: "POST",
      })
    );
    if (!family) throw new Error("Khong the chap nhan loi moi.");
    return family;
  },
  async rejectInvitation(invitationId: number | string) {
    await request<unknown>(`/api/family/invitations/${encodeURIComponent(String(invitationId))}/reject`, {
      method: "POST",
    });
  },
  async transferAdmin(targetUserId: string) {
    await request<null>("/api/family/admin/transfer", {
      method: "PATCH",
      body: JSON.stringify({ targetUserId }),
    });
  },
  async assignShoppingTask(_family_id: string, _shopping_list_id: string, _user_id: string, _actor_id: string) {
    throw new Error("Chuc nang phan cong mua hang chua co API backend.");
  },
  async respondShoppingTask(_family_id: string, _shopping_list_id: string, _user_id: string, _status: "accepted" | "rejected") {
    throw new Error("Chuc nang phan hoi nhiem vu mua hang chua co API backend.");
  },
};
