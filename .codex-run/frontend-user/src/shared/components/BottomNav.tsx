import { BarChart2, Home, Refrigerator, ScrollText, ShoppingCart, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", label: "Trang chủ", icon: Home },
  { to: "/fridge", label: "Tủ lạnh", icon: Refrigerator },
  { to: "/shopping", label: "Mua sắm", icon: ShoppingCart },
  { to: "/meal-planner", label: "Thực đơn", icon: ScrollText },
  { to: "/statistics", label: "Thống kê", icon: BarChart2 },
  { to: "/profile", label: "Hồ sơ", icon: UserRound },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-6 rounded-[18px] bg-white p-1.5 shadow-[0_18px_55px_rgba(37,28,52,0.25)] md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-[12px] px-1 py-2 text-[10px] font-bold transition ${
              isActive ? "bg-[#eee9f7] text-[#7655aa]" : "text-[#9188a1]"
            }`
          }
        >
          <item.icon className="h-4 w-4" />
          <span className="leading-tight">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
