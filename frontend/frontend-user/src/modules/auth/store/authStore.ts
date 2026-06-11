import { create } from "zustand";
import type { Family, User } from "@/types";
import { authApi } from "@/modules/auth/api/authApi";
import { familyApi } from "@/modules/family/api/familyApi";
import { getErrorMessage } from "@/shared/utils/errors";

type AuthState = {
  user: User | null;
  family: Family | null;
  loading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  loginWithGoogle: (supabaseAccessToken: string) => Promise<void>;
  register: (payload: { full_name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshFamily: () => Promise<Family | null>;
  updateProfile: (payload: Partial<Pick<User, "full_name" | "email" | "phone" | "avatar_url">>) => Promise<void>;
  changePassword: (payload: { old_password: string; new_password: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  family: null,
  loading: true,
  error: null,
  bootstrap: async () => {
    set({ loading: true });
    try {
      const session = await authApi.current();
      set({ user: session?.user ?? null, family: session?.family ?? null, loading: false });
    } catch (error) {
      set({ user: null, family: null, loading: false, error: getErrorMessage(error) });
    }
  },
  login: async (email, password, remember) => {
    set({ loading: true, error: null });
    try {
      const session = await authApi.login({ email, password, remember });
      set({ user: session.user, family: session.family, loading: false });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
  loginWithGoogle: async (supabaseAccessToken) => {
    set({ loading: true, error: null });
    try {
      const session = await authApi.loginWithGoogle(supabaseAccessToken);
      set({ user: session.user, family: session.family, loading: false });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      await authApi.register(payload);
      set({ user: null, family: null, loading: false });
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
  logout: async () => {
    await authApi.logout();
    set({ user: null, family: null, error: null });
  },
  refreshFamily: async () => {
    const family = await familyApi.me();
    set({ family });
    return family;
  },
  updateProfile: async (payload) => {
    const user = get().user;
    if (!user) throw new Error("Chưa đăng nhập.");
    const updated = await authApi.updateProfile(user.user_id, payload);
    set({ user: updated });
  },
  changePassword: async (payload) => {
    const user = get().user;
    if (!user) throw new Error("Chưa đăng nhập.");
    await authApi.changePassword(user.user_id, payload);
  },
  forgotPassword: async (email) => {
    await authApi.forgotPassword(email);
  },
  resetPassword: async (token, newPassword) => {
    await authApi.resetPassword(token, newPassword);
  },
}));
