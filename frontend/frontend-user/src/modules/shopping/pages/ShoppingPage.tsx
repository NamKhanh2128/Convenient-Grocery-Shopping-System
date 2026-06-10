import { ClipboardCheck, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useShoppingStore } from "@/modules/shopping/store/shoppingStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { AppModal } from "@/shared/components/AppModal";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/shared/utils/date";

type Tab = "today" | "week" | "done";

export function ShoppingPage() {
  const family = useAuthStore((state) => state.family)!;
  const location = useLocation();
  const highlightId = (location.state as { highlightId?: string } | null)?.highlightId;
  const { lists, load, complete, deleteList, loading } = useShoppingStore();
  const [tab, setTab] = useState<Tab>("today");
  const [completeId, setCompleteId] = useState<string | null>(null);
  useEffect(() => { void load(family.family_id); }, [family.family_id, load]);

  const filtered = useMemo(() => lists.filter((list) => {
    if (tab === "done") return list.status === "DONE";
    if (tab === "today") {
      return list.list_type !== "weekly" && list.status !== "DONE";
    }
    return list.list_type === "weekly" && list.status !== "DONE";
  }), [lists, tab]);

  async function completeList(id: string) {
    try {
      await complete(id, family.family_id);
      toast.success("Danh sách đã hoàn tất.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Danh sách còn item partial hoặc pending.");
    }
  }

  async function removeList(id: string) {
    try {
      await deleteList(id, family.family_id);
      toast.success("Đã xóa danh sách.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa danh sách.");
    }
  }

  return (
    <>
      <ScreenHeader
        title="Quản lý danh sách mua sắm"
        subtitle="Shopping chỉ quản lý checklist, quantity và trạng thái. Nhận mua/từ chối mua nằm trong Nhóm gia đình."
        actions={<Button asChild className="rounded-[8px] bg-[#ffb11f]"><Link to="/shopping/create"><Plus className="mr-2 h-4 w-4" />Tạo danh sách</Link></Button>}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {(["today", "week", "done"] as Tab[]).map((item) => <Button key={item} variant={tab === item ? "default" : "outline"} className={tab === item ? "bg-[#7655aa]" : ""} onClick={() => setTab(item)}>{item === "today" ? "Hôm nay" : item === "week" ? "Tuần này" : "Đã hoàn thành"}</Button>)}
      </div>
      {loading && (
        <div className="grid gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[8px] bg-white shadow-card" />
          ))}
        </div>
      )}
      <div className="grid gap-4">
        {filtered.map((list) => {
          const completed = list.items.filter((item) => item.item_status === "COMPLETED").length;
          const partial = list.items.filter((item) => item.item_status === "PARTIAL").length;
          const progress = list.items.length ? Math.round((completed / list.items.length) * 100) : 0;
          const assigned = list.assigned_user_id ? "Đã phân công" : "Chưa phân công";
          return (
            <section
              key={list.shopping_list_id}
              className={`rounded-[8px] bg-white p-5 shadow-card${highlightId === list.shopping_list_id ? " ring-2 ring-[#ffb11f]" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-[240px] flex-1">
                  <h3 className="text-xl font-extrabold">{list.title}</h3>
                  <p className="text-sm text-[#746d82]">{list.list_type === "weekly" ? "Theo tuần" : "Theo ngày"} · {formatDate(list.plan_date)} · {completed}/{list.items.length} completed · {partial} partial · {assigned}</p>
                  <div className="mt-3 h-2 rounded-full bg-[#eee9f7]"><div className="h-full rounded-full bg-[#31c875] transition-all" style={{ width: `${progress}%` }} /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="rounded-[8px]"><Link to={`/shopping/${list.shopping_list_id}`}><ShoppingCart className="mr-2 h-4 w-4" />Xem</Link></Button>
                  <Button onClick={() => setCompleteId(list.shopping_list_id)} className="rounded-[8px] bg-[#31c875]" disabled={list.status === "DONE" || progress < 100}>Hoàn tất</Button>
                  <Button variant="outline" className="rounded-[8px] border-red-200 text-red-600" onClick={() => void removeList(list.shopping_list_id)}>
                    <Trash2 className="mr-2 h-4 w-4" />Xóa
                  </Button>
                </div>
              </div>
            </section>
          );
        })}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-[8px] bg-white p-12 text-center shadow-card">
            <ClipboardCheck className="h-12 w-12 text-[#c9bfe0]" />
            <div>
              <b className="block text-[#3b2868]">Chưa có danh sách nào</b>
              <p className="mt-1 text-sm text-[#9188a1]">
                {tab === "done" ? "Chưa có danh sách nào được hoàn tất." : "Tạo danh sách mua sắm để bắt đầu."}
              </p>
            </div>
            {tab !== "done" && (
              <Button asChild className="mt-2 bg-[#ffb11f]"><Link to="/shopping/create"><Plus className="mr-2 h-4 w-4" />Tạo danh sách</Link></Button>
            )}
          </div>
        )}
      </div>
      <AppModal open={Boolean(completeId)} onOpenChange={(open) => !open && setCompleteId(null)} type="confirm" title="Hoàn tất mua sắm?" primaryLabel="Hoàn tất" secondaryLabel="Tiếp tục" onPrimary={async () => { if (completeId) await completeList(completeId); }}>
        Danh sách chỉ chuyển DONE nếu tất cả mặt hàng đã COMPLETED.
      </AppModal>
    </>
  );
}
