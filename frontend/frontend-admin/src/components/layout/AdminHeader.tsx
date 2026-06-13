import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LogOut,
  Plus,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Users2,
  UtensilsCrossed,
  BookOpen,
  BellDot,
  Settings,
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Layers,
  Ruler,
} from "lucide-react";
import { useAdminAuthStore } from "@/store/authStore";
import { useT } from "@/store/languageStore";
import { useNotificationStore } from "@/store/notificationStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppModal } from "@/components/shared/AppModal";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TranslationKey } from "@/lib/i18n";

const navItems: { to: string; labelKey: TranslationKey; icon: React.ElementType }[] = [
  { to: "/dashboard", labelKey: "navigation.dashboard", icon: LayoutDashboard },
  { to: "/users", labelKey: "navigation.users", icon: Users },
  { to: "/families", labelKey: "navigation.families", icon: Users2 },
  { to: "/food-categories", labelKey: "navigation.foodCategories", icon: Layers },
  { to: "/foods", labelKey: "navigation.foods", icon: UtensilsCrossed },
  { to: "/units", labelKey: "navigation.units", icon: Ruler },
  { to: "/recipes", labelKey: "navigation.recipes", icon: BookOpen },
  { to: "/notifications", labelKey: "navigation.notifications", icon: BellDot },
  { to: "/settings", labelKey: "navigation.settings", icon: Settings },
];

export function AdminHeader() {
  const user = useAdminAuthStore((state) => state.user);
  const logout = useAdminAuthStore((state) => state.logout);
  const t = useT();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Notifications state and store hook
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const {
    notifications,
    initialize,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      {/* Overlay to close notifications dropdown when clicking outside */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setNotificationsOpen(false)}
        />
      )}

      <header className="sticky top-0 z-40 flex h-[68px] w-full items-center justify-between bg-[#fbfbfe]/90 backdrop-blur-md px-6 shadow-sm border-b border-border/40">
        {/* Left: Brand Logo & Text */}
        <div className="flex items-center shrink-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ffb11f] text-white">
            <Plus className="h-6 w-6 text-white" />
          </div>
          <span className="ml-3 text-lg font-extrabold tracking-wide text-[#5b368d]">
            NATEAT Admin
          </span>
        </div>

        {/* Center: Navigation Links (visible on md and wider) */}
        <nav className="hidden md:flex items-center flex-1 justify-evenly max-w-xl mx-8">
          {navItems.map((item) => (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex h-10 w-10 items-center justify-center rounded-[12px] transition duration-200 ease-in-out ${
                      isActive
                        ? "bg-[#eee9f7] text-[#65439a] shadow-[inset_0_-3px_0_#ffb11f]"
                        : "text-[#9790a6] hover:bg-[#f1edf7] hover:text-[#65439a]"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t(item.labelKey)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 relative z-50">
          {/* Mobile Hamburger (visible below md) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="md:hidden grid h-10 w-10 place-items-center rounded-xl text-[#91889f] transition duration-200 hover:bg-[#f1eef8] hover:text-[#65439a]"
            title="Menu"
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Bell Notification Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`relative grid h-10 w-10 place-items-center rounded-xl text-[#91889f] transition duration-200 hover:bg-[#f1eef8] hover:text-[#65439a] cursor-pointer ${
                notificationsOpen ? "bg-[#f1eef8] text-[#65439a]" : ""
              }`}
              title="Thông báo"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white ring-1 ring-[#fbfbfe]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] origin-top-right rounded-2xl border border-border/40 bg-white shadow-xl ring-1 ring-black/5 z-50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/45 px-4 py-3 bg-[#fbfbfe]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-[#5b368d]">Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[9px] font-extrabold bg-[#7655aa]/10 text-[#7655aa] rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[10px] font-extrabold text-[#7655aa] hover:underline cursor-pointer"
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto divide-y divide-border/20">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground opacity-30 mb-2" />
                      <p className="text-xs font-semibold text-muted-foreground">Không có thông báo nào.</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const colors = {
                        success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                        warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                        error: "bg-rose-500/10 text-rose-600 border-rose-500/20",
                        info: "bg-[#eee9f7] text-[#7655aa] border-[#7655aa]/20",
                      };
                      const icons = {
                        success: CheckCircle2,
                        warning: AlertTriangle,
                        error: AlertCircle,
                        info: Info,
                      };
                      const IconComp = icons[n.type] || Info;
                      return (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`flex gap-3 p-3.5 hover:bg-[#faf8fd] transition-colors cursor-pointer relative ${
                            !n.isRead ? "bg-[#7655aa]/5" : ""
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${colors[n.type]}`}>
                            <IconComp className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1 pr-5">
                            <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                              {n.title}
                              {!n.isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                              )}
                            </h4>
                            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                            <span className="text-[9px] font-semibold text-muted-foreground/60 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} - {new Date(n.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className="absolute top-3.5 right-3 h-5 w-5 grid place-items-center text-muted-foreground/40 hover:text-destructive transition rounded cursor-pointer"
                            title="Xóa thông báo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-border/40 p-2 bg-[#fbfbfe] text-center">
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate("/notifications");
                    }}
                    className="text-xs font-bold text-[#7655aa] hover:underline transition py-1 block w-full cursor-pointer"
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="cursor-pointer transition hover:scale-105 active:scale-95"
            title={t("profile")}
          >
            <Avatar className="h-9 w-9 bg-[#ffbd2c] text-[#4b3178] border border-[#ffbd2c]/30 shadow-sm">
              <AvatarFallback className="text-sm font-extrabold">
                {user?.full_name?.charAt(0).toUpperCase() ?? "A"}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl text-[#91889f] transition hover:bg-[#f1eef8] hover:text-destructive cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Logout Confirmation Modal */}
        <AppModal
          open={logoutOpen}
          onOpenChange={setLogoutOpen}
          type="confirm"
          title="Đăng xuất khỏi hệ thống?"
          primaryLabel="Đăng xuất"
          secondaryLabel="Hủy"
          onPrimary={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
        >
          Phiên làm việc admin của bạn sẽ kết thúc. Bạn cần đăng nhập lại để tiếp tục quản trị.
        </AppModal>
      </header>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 top-[68px] bg-black/40 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      {drawerOpen && (
        <div className="fixed top-[68px] right-0 bottom-0 w-[280px] bg-[#fbfbfe] shadow-lg border-l border-border z-50 md:hidden overflow-y-auto transition duration-300 ease-in-out">
          <nav className="flex flex-col py-4 px-3 gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 h-12 py-3 px-6 text-sm font-semibold rounded-xl transition hover:bg-[#f1edf7] ${
                    isActive
                      ? "bg-[#eee9f7] text-[#65439a] shadow-[inset_0_-3px_0_#ffb11f]"
                      : "text-[#9790a6] hover:text-[#65439a]"
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
