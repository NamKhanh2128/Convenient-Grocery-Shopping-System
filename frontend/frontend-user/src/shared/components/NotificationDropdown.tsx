import { Bell, CheckCheck, Clock, Refrigerator, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const notifications = [
  { id: "n1", type: "expiry", title: "Thực phẩm sắp hết hạn", body: "Thịt bò còn 2 ngày", to: "/fridge", icon: Refrigerator },
  { id: "n2", type: "cook", title: "Tới giờ nấu ăn", body: "Bữa tối bắt đầu lúc 18:00", to: "/meal-planner", icon: Clock },
  { id: "n3", type: "shopping", title: "Shopping assigned", body: "Bạn có nhiệm vụ mua 3 mặt hàng", to: "/shopping", icon: ShoppingCart },
];

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const unread = notifications.filter((item) => !readIds.includes(item.id));
  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} className="relative grid h-11 w-11 place-items-center rounded-xl bg-[#f1eef8] text-[#ffad1f]" title="Thông báo">
        <Bell className="h-5 w-5" />
        {unread.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#ef3d3d] text-xs font-bold text-white">{unread.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-50 w-80 rounded-[8px] bg-white p-3 shadow-[0_22px_70px_rgba(37,28,52,0.24)]">
          <div className="mb-2 flex items-center justify-between">
            <b>Thông báo</b>
            <button className="inline-flex items-center gap-1 text-xs font-bold text-[#7655aa]" onClick={() => setReadIds(notifications.map((item) => item.id))}>
              <CheckCheck className="h-3 w-3" /> mark read
            </button>
          </div>
          <div className="space-y-2">
            {notifications.map((item) => (
              <Link key={item.id} to={item.to} onClick={() => { setReadIds((prev) => [...new Set([...prev, item.id])]); setOpen(false); }} className={`flex gap-3 rounded-[8px] p-3 text-sm ${readIds.includes(item.id) ? "bg-[#f7f5fa]" : "bg-[#fff7e6]"}`}>
                <item.icon className="mt-1 h-4 w-4 text-[#7655aa]" />
                <span><b className="block">{item.title}</b><span className="text-xs text-[#746d82]">{item.body}</span></span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
