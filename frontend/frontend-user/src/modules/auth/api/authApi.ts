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

function authedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return request<T>(path, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
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
  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;
    try {
      const data = await request<AuthResponse>(endpoints.auth.refresh, {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
      if (!data.accessToken) return null;
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    }
  },
  async current(): Promise<AuthSession | null> {
    let token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return null;

    let data: { user: User };
    try {
      data = await request<{ user: User }>(endpoints.auth.profile, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Access token likely expired — try to refresh with the 7-day refresh token.
      const newToken = await this.refreshAccessToken();
      if (!newToken) {
        clearSession();
        return null;
      }
      token = newToken;
      data = await request<{ user: User }>(endpoints.auth.profile, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
    }

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
  async updateProfile(
    _user_id: string,
    payload: Partial<Pick<User, "full_name" | "email" | "phone" | "avatar_url">>
  ): Promise<User> {
    const data = await authedRequest<{ message?: string; user?: User }>(endpoints.auth.updateProfile, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!data.user) throw new Error(data.message || "Cap nhat ho so that bai.");
    return data.user;
  },
  async changePassword(_user_id: string, payload: { old_password: string; new_password: string }) {
    return authedRequest<{ message: string }>(endpoints.auth.changePassword, {
      method: "POST",
      body: JSON.stringify({ oldPassword: payload.old_password, newPassword: payload.new_password }),
    });
  },
  async forgotPassword(email: string) {
    return request<{ message: string }>(endpoints.auth.forgotPassword, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async resetPassword(token: string, newPassword: string) {
    return request<{ message: string }>(endpoints.auth.resetPassword, {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },
};
