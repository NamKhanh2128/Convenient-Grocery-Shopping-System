import { endpoints } from "@/shared/constants/endpoints";
import type { AuthSession, Family, User } from "@/types";
import { apiClient } from "@/shared/lib/apiClient";

export const authApi = {
  endpoint: endpoints.auth,

  async login(payload: { email: string; password: string; remember?: boolean }): Promise<AuthSession> {
    if (!payload.email || !payload.password) throw new Error("Vui lòng nhập đầy đủ email và mật khẩu.");
    
    const { data } = await apiClient.post('/auth/login', payload);
    if (!data.success) throw new Error(data.message || "Đăng nhập thất bại");
    
    const { token, user, family } = data.data;
    
    localStorage.setItem("nateat.session", token);
    localStorage.setItem("nateat.user_id", user.user_id);
    
    if (payload.remember) localStorage.setItem("nateat.remembered_email", payload.email);
    else localStorage.removeItem("nateat.remembered_email");
    
    return { token, user, family };
  },

  async register(payload: { full_name: string; email: string; password: string; phone?: string }): Promise<AuthSession> {
    const { data } = await apiClient.post('/auth/register', payload);
    if (!data.success) throw new Error(data.message || "Đăng ký thất bại");
    
    const { token, user, family } = data.data;
    
    localStorage.setItem("nateat.session", token);
    localStorage.setItem("nateat.user_id", user.user_id);
    
    return { token, user, family };
  },

  async current(): Promise<AuthSession | null> {
    const token = localStorage.getItem("nateat.session");
    if (!token) return null;
    
    // For simplicity without a GET /me endpoint, we just return mock session if token exists
    // In a real app, you would verify the token with the backend and get the user
    const user_id = localStorage.getItem("nateat.user_id") || "1";
    
    const user: User = { 
      user_id, 
      email: "user@nateat.vn", 
      full_name: "Người dùng", 
      role: "USER" 
    };

    const family: Family = { family_id: "family-mock-1", family_name: `Gia đình của ${user.full_name}`, created_by: user_id };
    
    return { token, user, family };
  },

  async logout() {
    localStorage.removeItem("nateat.session");
    localStorage.removeItem("nateat.user_id");
  },

  async updateProfile(user_id: string, payload: Pick<User, "full_name" | "email">): Promise<User> {
    throw new Error("Tính năng chưa được hỗ trợ ở backend");
  },

  async changePassword(user_id: string, payload: { old_password: string; new_password: string }) {
    throw new Error("Tính năng chưa được hỗ trợ ở backend");
  },
};
