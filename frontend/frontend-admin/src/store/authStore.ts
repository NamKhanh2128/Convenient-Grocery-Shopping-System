import { create } from "zustand";
import { http } from "@/lib/httpClient";
import { getSession, setSession } from "@/lib/mockDb";
import { supabase } from "@/lib/supabaseClient";

const REFRESH_TOKEN_KEY = "nateat.refreshToken";

export type AdminUser = {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
};

type AuthResponse = {
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: AdminUser;
};

type AdminAuthState = {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  loginWithGoogle: (supabaseAccessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: Pick<AdminUser, "full_name" | "email" | "phone">) => Promise<void>;
  changePassword: (payload: { old_password: string; new_password: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
};

function persistSession(accessToken: string, refreshToken: string | undefined, userId: string) {
  setSession({ token: accessToken, user_id: userId });
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearSession() {
  setSession(null);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  bootstrap: async () => {
    set({ loading: true });
    try {
      const session = getSession();
      if (!session) {
        set({ user: null, loading: false });
        return;
      }
      const data = await http.get<{ user: AdminUser }>("/auth/me");
      // ⚠️ Must be ADMIN role
      if (!data.user || data.user.role !== "ADMIN") {
        clearSession();
        set({ user: null, loading: false });
        return;
      }
      set({ user: data.user, loading: false });
    } catch {
      clearSession();
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (!email || !password) throw new Error("Vui lòng nhập đầy đủ email và mật khẩu.");
      const data = await http.post<AuthResponse>("/auth/login", { email, password });
      if (!data.accessToken || !data.user) throw new Error(data.message || "Đăng nhập thất bại.");
      // ⚠️ Admin-only check - real role comes from backend
      if (data.user.role !== "ADMIN") throw new Error("Tài khoản không có quyền quản trị.");

      persistSession(data.accessToken, data.refreshToken, data.user.user_id);
      set({ user: data.user, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  signInWithGoogleRedirect: async () => {
    const redirectTo = `${window.location.origin}/oauth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) throw new Error(error.message);
  },

  loginWithGoogle: async (supabaseAccessToken) => {
    set({ loading: true, error: null });
    try {
      const data = await http.post<AuthResponse>("/auth/oauth/google", { supabaseAccessToken });
      if (!data.accessToken || !data.user) throw new Error(data.message || "Đăng nhập Google thất bại.");
      // ⚠️ Admin-only check - real role comes from backend
      if (data.user.role !== "ADMIN") throw new Error("Tài khoản không có quyền quản trị.");

      persistSession(data.accessToken, data.refreshToken, data.user.user_id);
      set({ user: data.user, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      await http.post("/auth/logout", { refreshToken }).catch(() => undefined);
    }
    clearSession();
    set({ user: null, error: null });
  },

  updateProfile: async (payload) => {
    const data = await http.post<{ message: string; user: AdminUser }>("/auth/update-profile", payload);
    set({ user: data.user });
  },

  changePassword: async (payload) => {
    await http.post("/auth/change-password", {
      oldPassword: payload.old_password,
      newPassword: payload.new_password,
    });
  },

  forgotPassword: async (email) => {
    await http.post("/auth/forgot-password", { email });
  },

  resetPassword: async (token, newPassword) => {
    await http.post("/auth/reset-password", { token, newPassword });
  },
}));
