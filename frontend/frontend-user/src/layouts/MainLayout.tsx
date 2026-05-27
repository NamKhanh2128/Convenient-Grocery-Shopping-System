import { BarChart2, Home, LogOut, Plus, Refrigerator, ScrollText, ShoppingCart, Users, UserRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { BottomNav } from "@/shared/components/BottomNav";
import { NotificationDropdown } from "@/shared/components/NotificationDropdown";
import { AppModal } from "@/shared/components/AppModal";

const navItems = [
  { to: "/dashboard", label: "Trang chủ", icon: Home },
  { to: "/fridge", label: "Tủ lạnh", icon: Refrigerator },
  { to: "/shopping", label: "Danh sách mua sắm", icon: ShoppingCart },
  { to: "/meal-planner", label: "Kế hoạch bữa ăn", icon: ScrollText },
  { to: "/statistics", label: "Thống kê", icon: BarChart2 },
  { to: "/family", label: "Gia đình", icon: Users },
  { to: "/profile", label: "Hồ sơ", icon: UserRound },
];

export function MainLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [logoutOpen, setLogoutOpen] = useState(false);

  async function handleLogout() {
    await logout();
    toast.success("Đã đăng xuất.");
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#66429c] font-sans text-foreground">
      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between bg-[#fbfbfe] px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/shopping/create")}
            className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffb11f] text-white shadow-sm transition hover:scale-105"
            title="Tạo danh sách mua sắm"
          >
            <Plus className="h-6 w-6" strokeWidth={3} />
          </button>
          <button onClick={() => navigate("/dashboard")} className="text-2xl font-extrabold tracking-wide text-[#5b368d]">
            NATEAT
          </button>
        </div>

        <nav className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `inline-flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#eee9f7] text-[#65439a] shadow-[inset_0_-3px_0_#ffb11f]"
                    : "text-[#9790a6] hover:bg-[#f1edf7] hover:text-[#65439a]"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden 2xl:inline">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NotificationDropdown />
          <NavLink to="/profile" className="grid h-11 w-11 place-items-center rounded-full bg-[#ffbd2c] text-[#4b3178]" title="Hồ sơ">
            <UserRound className="h-6 w-6" />
          </NavLink>
          <div className="hidden leading-tight lg:block">
            <div className="text-sm font-bold">{user?.full_name}</div>
            <div className="text-xs text-muted-foreground">{user?.role === "ADMIN" ? "Quản trị" : "Thành viên"}</div>
          </div>
          <button
            onClick={() => setLogoutOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl text-[#91889f] transition hover:bg-[#f1eef8] hover:text-destructive"
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6">
        <Outlet />
      </main>

      <BottomNav />

      <AppModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        type="confirm"
        title="Đăng xuất?"
        primaryLabel="Đăng xuất"
        secondaryLabel="Hủy"
        onPrimary={handleLogout}
      >
        Phiên làm việc hiện tại sẽ kết thúc. Bạn có thể đăng nhập lại bất cứ lúc nào.
      </AppModal>
    </div>
  );
}
