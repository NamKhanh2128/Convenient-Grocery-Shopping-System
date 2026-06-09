import { familyApi } from "@/modules/family/api/familyApi";
import { endpoints } from "@/shared/constants/endpoints";
import type { AuthSession, User } from "@/types";

function normalizeApiOrigin(value?: string) {
  return (value || "http://localhost:3000").replace(/\/api\/?$/, "");
}

const API_BASE_URL = normalizeApiOrigin(import.meta.env.VITE_API_BASE_URL);
const ACCESS_TOKEN_KEY = "nateat.token";
const REFRESH_TOKEN_KEY = "nateat.refreshToken";

type AuthResponse = {
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Khong the ket noi toi may chu.");
  }

  return data as T;
}

function saveSession(accessToken: string, refreshToken?: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export const authApi = {
  endpoint: endpoints.auth,
  async login(payload: { email: string; password: string; remember?: boolean }): Promise<AuthSession> {
    const data = await request<AuthResponse>(endpoints.auth.login, {
      method: "POST",
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    });

    if (!data.accessToken || !data.user) throw new Error("Dang nhap that bai.");
    saveSession(data.accessToken, data.refreshToken);
    if (payload.remember) localStorage.setItem("nateat.remembered_email", payload.email);
    else localStorage.removeItem("nateat.remembered_email");

    const family = await familyApi.me().catch(() => null);
    return { token: data.accessToken, refreshToken: data.refreshToken, user: data.user, family };
  },
  async register(payload: { full_name: string; email: string; password: string; phone?: string }): Promise<AuthSession> {
    const data = await request<AuthResponse>(endpoints.auth.register, {
      method: "POST",
      body: JSON.stringify({
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
      }),
    });

    if (!data.user) throw new Error("Dang ky that bai.");
    return { token: "", user: data.user, family: null };
  },
  async current(): Promise<AuthSession | null> {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;

    const data = await request<{ user: User }>(endpoints.auth.profile, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const family = await familyApi.me().catch(() => null);
    return { token, refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined, user: data.user, family };
  },
  async logout() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      await request(endpoints.auth.logout, {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    clearSession();
  },
  async updateProfile(_user_id: string, _payload: Pick<User, "full_name" | "email">): Promise<User> {
    throw new Error("Chuc nang cap nhat ho so chua duoc ket noi backend.");
  },
  async changePassword(_user_id: string, _payload: { old_password: string; new_password: string }) {
    throw new Error("Chuc nang doi mat khau chua duoc ket noi backend.");
  },
};
