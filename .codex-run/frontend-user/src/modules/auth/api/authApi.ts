import { endpoints } from "@/shared/constants/endpoints";
import type { AuthSession, Family, User } from "@/types";
import { db, getSession, saveDb, setSession } from "@/shared/lib/mockDb";
import { uid } from "@/shared/utils/storage";

export const authApi = {
  endpoint: endpoints.auth,
  async login(payload: { email: string; password: string; remember?: boolean }): Promise<AuthSession> {
    const state = await db();
    if (!payload.email || !payload.password) throw new Error("Vui lòng nhập đầy đủ email và mật khẩu.");
    const user = state.users.find((item) => item.email.toLowerCase() === payload.email.toLowerCase());
    if (!user) throw new Error("Email hoặc mật khẩu không đúng.");
    const expectedPassword = user.password ?? (user.role === "ADMIN" ? "Admin@123" : "User@123");
    if (expectedPassword !== payload.password) throw new Error("Email hoặc mật khẩu không đúng.");
    if (user.locked) throw new Error("Tài khoản đã bị khóa.");
    const family = state.families.find((item) => item.created_by === user.user_id) ?? state.families.find((family) => state.family_members.some((member) => member.family_id === family.family_id && member.user_id === user.user_id));
    if (!family) throw new Error("Không tìm thấy gia đình của người dùng.");
    const token = `mock-token-${user.user_id}`;
    setSession({ token, user_id: user.user_id });
    if (payload.remember) localStorage.setItem("nateat.remembered_email", payload.email);
    else localStorage.removeItem("nateat.remembered_email");
    return { token, user: { ...user, password: undefined }, family };
  },
  async register(payload: { full_name: string; email: string; password: string; phone?: string }): Promise<AuthSession> {
    const state = await db();
    if (state.users.some((item) => item.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error("Email đã tồn tại.");
    }
    const user_id = uid("user");
    const family_id = uid("family");
    const user: User = { user_id, full_name: payload.full_name, email: payload.email, phone: payload.phone, password: payload.password, role: "USER" };
    const family: Family = { family_id, family_name: `Gia đình của ${payload.full_name}`, created_by: user_id };
    state.users.push(user);
    state.families.push(family);
    state.family_members.push({ id: uid("family-member"), family_id, user_id });
    saveDb(state);
    const token = `mock-token-${user_id}`;
    setSession({ token, user_id });
    return { token, user: { ...user, password: undefined }, family };
  },
  async current(): Promise<AuthSession | null> {
    const session = getSession();
    if (!session) return null;
    const state = await db();
    const user = state.users.find((item) => item.user_id === session.user_id);
    if (!user) return null;
    const family = state.families.find((item) => item.created_by === user.user_id) ?? state.families.find((family) => state.family_members.some((member) => member.family_id === family.family_id && member.user_id === user.user_id));
    if (!family) return null;
    return { token: session.token, user: { ...user, password: undefined }, family };
  },
  async logout() {
    setSession(null);
  },
  async updateProfile(user_id: string, payload: Pick<User, "full_name" | "email">): Promise<User> {
    const state = await db();
    const index = state.users.findIndex((item) => item.user_id === user_id);
    if (index < 0) throw new Error("Không tìm thấy người dùng.");
    if (state.users.some((item) => item.user_id !== user_id && item.email.toLowerCase() === payload.email.toLowerCase())) throw new Error("Email đã tồn tại.");
    state.users[index] = { ...state.users[index], ...payload };
    saveDb(state);
    return { ...state.users[index], password: undefined };
  },
  async changePassword(user_id: string, payload: { old_password: string; new_password: string }) {
    const state = await db();
    const user = state.users.find((item) => item.user_id === user_id);
    if (!user) throw new Error("Không tìm thấy người dùng.");
    if (user.password !== payload.old_password) throw new Error("Mật khẩu hiện tại không đúng.");
    user.password = payload.new_password;
    saveDb(state);
  },
};
