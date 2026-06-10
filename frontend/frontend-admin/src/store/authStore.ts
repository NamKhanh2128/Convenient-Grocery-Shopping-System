import { create } from "zustand";
import type { User } from "@/types";
import { db, saveDb, getSession, setSession } from "@/lib/mockDb";

const ADMIN_TOKEN_PREFIX = "mock-token-";

type AdminAuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: Pick<User, "full_name" | "email" | "phone">) => Promise<void>;
  changePassword: (payload: { old_password: string; new_password: string }) => Promise<void>;
};

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
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
      const state = await db();
      const user = state.users.find((u) => u.user_id === session.user_id);
      // ⚠️ Must be ADMIN role
      if (!user || user.role !== "ADMIN") {
        setSession(null);
        set({ user: null, loading: false });
        return;
      }
      set({ user: { ...user, password: undefined }, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (!email || !password) throw new Error("Vui lòng nhập đầy đủ email và mật khẩu.");
      const state = await db();
      const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error("Email hoặc mật khẩu không đúng.");
      const expectedPassword = user.password ?? (user.role === "ADMIN" ? "Admin@123" : "User@123");
      if (expectedPassword !== password) throw new Error("Email hoặc mật khẩu không đúng.");
      // ⚠️ Admin-only check
      if (user.role !== "ADMIN") throw new Error("Tài khoản không có quyền quản trị.");
      if (user.locked) throw new Error("Tài khoản đã bị khóa.");
      const token = `${ADMIN_TOKEN_PREFIX}${user.user_id}`;
      setSession({ token, user_id: user.user_id });
      set({ user: { ...user, password: undefined }, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    setSession(null);
    set({ user: null, error: null });
  },

  updateProfile: async (payload) => {
    const user = get().user;
    if (!user) throw new Error("Chưa đăng nhập.");
    const state = await db();
    const index = state.users.findIndex((u) => u.user_id === user.user_id);
    if (index < 0) throw new Error("Không tìm thấy tài khoản.");
    if (
      state.users.some(
        (u) => u.user_id !== user.user_id && u.email.toLowerCase() === payload.email.toLowerCase(),
      )
    )
      throw new Error("Email đã tồn tại.");
    state.users[index] = { ...state.users[index], ...payload } as User;
    saveDb(state);
    set({ user: { ...state.users[index], password: undefined } as User });
  },

  changePassword: async (payload) => {
    const user = get().user;
    if (!user) throw new Error("Chưa đăng nhập.");
    const state = await db();
    const found = state.users.find((u) => u.user_id === user.user_id);
    if (!found) throw new Error("Không tìm thấy tài khoản.");
    if (found.password !== payload.old_password) throw new Error("Mật khẩu hiện tại không đúng.");
    found.password = payload.new_password;
    saveDb(state);
  },
}));
