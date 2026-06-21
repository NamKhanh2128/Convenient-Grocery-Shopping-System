import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Edit, Filter, MapPin, Package, Plus, Search, SortAsc, Trash2, Utensils, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useFridgeStore } from "@/modules/fridge/store/fridgeStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { AppModal } from "@/shared/components/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { foodLocations } from "@/shared/constants/options";
import { daysUntil, formatDate } from "@/shared/utils/date";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function FridgePage() {
  const navigate = useNavigate();
  const family = useAuthStore((state) => state.family)!;
  const { items, load, remove, removeMany, update, consume, loading, error } = useFridgeStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [expiry, setExpiry] = useState("all");
  const [location, setLocation] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [consumeId, setConsumeId] = useState<string | null>(null);
  const [consumeQuantity, setConsumeQuantity] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);
  const [detailFoodId, setDetailFoodId] = useState<string | null>(null);

  // Multi-delete state
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => { void load(family.family_id); }, [family.family_id, load]);
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Group items by food_id to detect duplicates
  const foodIdCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((item) => { map[item.food_id] = (map[item.food_id] ?? 0) + 1; });
    return map;
  }, [items]);

  const detailItems = useMemo(
    () => items.filter((item) => item.food_id === detailFoodId),
    [items, detailFoodId]
  );

  function handleFoodNameClick(foodId: string) {
    setDetailFoodId(foodId);
  }

  const expiring = items.filter((item) => daysUntil(item.expiry_date) <= 3);
  // Categories are admin-managed and open-ended (new ones can be added
  // anytime), so derive the filter options from what's actually in the
  // fridge instead of a fixed list that would miss new categories.
  const availableCategories = useMemo(
    () => Array.from(new Set(items.map((item) => item.food.category))).sort((a, b) => a.localeCompare(b, "vi")),
    [items],
  );
  const filtered = useMemo(() => items.filter((item) => {
    const matchesName = item.food.food_name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || item.food.category === category;
    const matchesExpiry = expiry === "all" || (expiry === "soon" ? daysUntil(item.expiry_date) <= 3 : daysUntil(item.expiry_date) < 0);
    const matchesLocation = location === "all" || item.location === location;
    return matchesName && matchesCategory && matchesExpiry && matchesLocation;
  }).sort((a, b) => sortAsc ? daysUntil(a.expiry_date) - daysUntil(b.expiry_date) : daysUntil(b.expiry_date) - daysUntil(a.expiry_date)), [items, query, category, expiry, location, sortAsc]);

  function handleDeleteButtonClick() {
    if (!deleteMode) {
      setDeleteMode(true);
      setSelectedIds([]);
      return;
    }
    if (selectedIds.length === 0) {
      setDeleteMode(false);
      return;
    }
    setBulkDeleteOpen(true);
  }

  function toggleSelectItem(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const deleted = items.find((item) => item.fridge_item_id === deleteId);
    await remove(deleteId, family.family_id);
    toast.success("Đã xóa", {
      action: { label: "Hoàn tác", onClick: () => toast.info(`Khôi phục ${deleted?.food.food_name ?? "thực phẩm"} sẽ gọi API undo delete.`) },
    });
  }

  async function confirmBulkDelete() {
    await removeMany(selectedIds, family.family_id);
    const count = selectedIds.length;
    setSelectedIds([]);
    setDeleteMode(false);
    toast.success(`Đã xóa ${count} thực phẩm.`);
  }

  async function confirmConsume() {
    const item = items.find((row) => row.fridge_item_id === consumeId);
    if (!item) return;
    if (!Number.isFinite(consumeQuantity) || consumeQuantity <= 0) {
      toast.error("Số lượng dùng phải lớn hơn 0.");
      return;
    }
    if (consumeQuantity > item.quantity) {
      toast.error(`Chỉ còn ${item.quantity} ${item.food.unit} trong tủ.`);
      return;
    }
    try {
      const { deleted } = await consume(item.fridge_item_id, consumeQuantity, family.family_id);
      toast.success(
        deleted
          ? `Đã dùng hết "${item.food.food_name}".`
          : `Đã dùng ${consumeQuantity} ${item.food.unit} "${item.food.food_name}".`,
      );
      setConsumeId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật số lượng.");
    }
  }

  const deleteButtonLabel = !deleteMode
    ? "Xóa"
    : selectedIds.length > 0
      ? `Xóa ${selectedIds.length} mục`
      : "Hủy chọn";

  return (
    <>
      <ScreenHeader
        title="Quản lý tủ lạnh"
        subtitle="Hiển thị danh sách kho thực phẩm, lọc, thêm, cập nhật, xóa và xem cảnh báo hết hạn theo UC003."
        actions={
          <div className="flex flex-wrap gap-2">
            {deleteMode && (
              <span className="self-center text-sm font-semibold text-[#7655aa]">
                {selectedIds.length} đã chọn
              </span>
            )}
            <Button
              variant={deleteMode && selectedIds.length > 0 ? "destructive" : "outline"}
              onClick={handleDeleteButtonClick}
              className={deleteMode && selectedIds.length === 0 ? "border-[#7655aa] text-[#7655aa]" : ""}
            >
              {deleteMode && selectedIds.length === 0
                ? <X className="mr-2 h-4 w-4" />
                : <Trash2 className="mr-2 h-4 w-4" />}
              {deleteButtonLabel}
            </Button>
            <Button asChild className="rounded-[8px] bg-[#ffb11f]">
              <Link to="/fridge/add">
                <Plus className="mr-2 h-4 w-4" />Thêm thực phẩm
              </Link>
            </Button>
          </div>
        }
      />

      {expiring.length > 0 && (
        <div className="mb-5 rounded-[8px] border border-[#ffb11f] bg-[#fff7df] p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <b className="text-[#9a5a00]">Cảnh báo: {expiring.length} thực phẩm sắp hết hạn trong 3 ngày.</b>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setExpiry("soon"); setFilterOpen(false); }}>Xem chi tiết</Button>
              <Button size="sm" className="bg-[#7655aa]" onClick={() => navigate("/meal-planner")}>Gợi ý món từ tủ lạnh</Button>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-[8px] bg-white p-5 shadow-card">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#9188a1]" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Tìm theo tên..." />
          </div>
          <Button variant="outline" onClick={() => setFilterOpen(true)}><Filter className="mr-2 h-4 w-4" />Lọc</Button>
          <Button variant="outline" onClick={() => setSortAsc((value) => !value)}><SortAsc className="mr-2 h-4 w-4" />Sắp xếp</Button>
        </div>

        {/* Delete mode: select-all banner */}
        {deleteMode && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#f3f0fb] px-4 py-2 text-sm text-[#7655aa]">
            <Checkbox
              checked={selectedIds.length === filtered.length && filtered.length > 0}
              onCheckedChange={(checked) =>
                setSelectedIds(checked ? filtered.map((i) => i.fridge_item_id) : [])
              }
            />
            <span className="font-medium">Chọn tất cả ({filtered.length} thực phẩm)</span>
          </div>
        )}

        {/* Mobile cards */}
        <div className="mt-5 grid gap-3 lg:hidden">
          {filtered.map((item) => (
            <FoodCard
              key={item.fridge_item_id}
              item={item}
              deleteMode={deleteMode}
              selected={selectedIds.includes(item.fridge_item_id)}
              onToggleSelect={() => toggleSelectItem(item.fridge_item_id)}
              onDelete={() => setDeleteId(item.fridge_item_id)}
              hasDuplicate={(foodIdCounts[item.food_id] ?? 0) > 1}
              onFoodNameClick={() => handleFoodNameClick(item.food_id)}
            />
          ))}
        </div>

        {/* Desktop table */}
        <div className="mt-5 hidden overflow-hidden rounded-[8px] border lg:block">
          <table className="w-full text-sm">
            <thead className="bg-[#fbfacb] text-left">
              <tr>
                {deleteMode && <th className="p-3 w-10" />}
                <th className="p-3">Tên thực phẩm</th>
                <th>Số lượng</th>
                <th>Đơn vị</th>
                <th>Hạn sử dụng</th>
                <th>Danh mục</th>
                <th>Vị trí</th>
                <th className="text-right pr-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.fridge_item_id}
                  className={`border-t ${deleteMode && selectedIds.includes(item.fridge_item_id) ? "bg-[#f3f0fb]" : ""}`}
                >
                  {deleteMode && (
                    <td className="p-3">
                      <Checkbox
                        checked={selectedIds.includes(item.fridge_item_id)}
                        onCheckedChange={() => toggleSelectItem(item.fridge_item_id)}
                      />
                    </td>
                  )}
                  <td className="p-3 font-bold">
                    {!deleteMode ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-left hover:text-[#7655aa] transition-colors cursor-pointer"
                        onClick={() => handleFoodNameClick(item.food_id)}
                        title="Xem chi tiết HSD"
                      >
                        {item.food.icon} {item.food.food_name}
                        {(foodIdCounts[item.food_id] ?? 0) > 1 && (
                          <span className="ml-1 rounded-full bg-[#7655aa]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#7655aa]">
                            {foodIdCounts[item.food_id]} lô
                          </span>
                        )}
                      </button>
                    ) : (
                      <span>{item.food.icon} {item.food.food_name}</span>
                    )}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{item.food.unit}</td>
                  <td>
                    <span className={daysUntil(item.expiry_date) <= 3 ? "font-bold text-red-600" : ""}>
                      {formatDate(item.expiry_date)}
                    </span>
                  </td>
                  <td>{item.food.category}</td>
                  <td>{item.location}</td>
                  <td className="space-x-2 pr-3 text-right">
                    {!deleteMode && (
                      <>
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/fridge/edit/${item.fridge_item_id}`}><Edit className="h-4 w-4" /></Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setConsumeId(item.fridge_item_id); setConsumeQuantity(1); }}>
                          <Utensils className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteId(item.fridge_item_id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {deleteMode && (
                      <span className="text-xs text-[#9188a1] italic">
                        {selectedIds.includes(item.fridge_item_id) ? "✓ Đã chọn" : "Chọn để xóa"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={deleteMode ? 8 : 7} className="p-8 text-center text-[#746d82]">
                    {loading ? "Đang tải..." : "Tủ lạnh trống hoặc không có kết quả phù hợp."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Filter modal */}
      <AppModal open={filterOpen} onOpenChange={setFilterOpen} title="Bộ lọc tủ lạnh" type="info" primaryLabel="Áp dụng" secondaryLabel="Đóng">
        <div className="space-y-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tên thực phẩm" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {availableCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={expiry} onValueChange={setExpiry}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả HSD</SelectItem>
              <SelectItem value="soon">Sắp hết hạn</SelectItem>
              <SelectItem value="expired">Đã hết hạn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vị trí</SelectItem>
              {foodLocations.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setQuery(""); setCategory("all"); setExpiry("all"); setLocation("all"); }}>Đặt lại</Button>
        </div>
      </AppModal>

      {/* Single delete modal */}
      <AppModal open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)} type="confirm" title="Xóa thực phẩm?" primaryLabel="Xóa" secondaryLabel="Hủy" onPrimary={confirmDelete}>
        Hành động này không thể hoàn tác.
      </AppModal>

      {/* Bulk delete modal */}
      <AppModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} type="confirm" title="Xóa hàng loạt?" primaryLabel="Xóa" secondaryLabel="Hủy" onPrimary={confirmBulkDelete}>
        Hành động này sẽ xóa <b>{selectedIds.length}</b> thực phẩm khỏi tủ lạnh và không thể hoàn tác.
      </AppModal>

      {/* Consume modal */}
      <AppModal open={Boolean(consumeId)} onOpenChange={(open) => !open && setConsumeId(null)} type="confirm" title="Dùng nhanh thực phẩm" primaryLabel="Cập nhật" secondaryLabel="Hủy" onPrimary={confirmConsume}>
        <Input type="number" min={0.01} step="0.01" value={consumeQuantity} onChange={(event) => setConsumeQuantity(Number(event.target.value))} />
      </AppModal>

      {/* Food detail popup */}
      <Dialog open={Boolean(detailFoodId)} onOpenChange={(open) => !open && setDetailFoodId(null)}>
        <DialogContent className="rounded-[12px] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#7655aa]">
              {detailItems[0]?.food.icon}{" "}
              {detailItems[0]?.food.food_name}
              <span className="ml-1 rounded-full bg-[#7655aa]/10 px-2 py-0.5 text-xs font-semibold text-[#7655aa]">
                {detailItems.length} lô
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            {detailItems.map((item, idx) => {
              const days = daysUntil(item.expiry_date);
              const isExpired = days < 0;
              const isSoon = !isExpired && days <= 3;
              return (
                <div
                  key={item.fridge_item_id}
                  className={`rounded-[8px] border p-4 ${isExpired
                      ? "border-red-200 bg-red-50"
                      : isSoon
                        ? "border-orange-200 bg-orange-50"
                        : "border-[#e8e4f0] bg-[#faf9fd]"
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#9188a1]">Lô #{idx + 1}</span>
                    {isExpired ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Đã hết hạn</span>
                    ) : isSoon ? (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">Sắp hết hạn</span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Còn hạn</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-[#5f586d]">
                      <Package className="h-4 w-4 shrink-0 text-[#7655aa]" />
                      <span><span className="font-semibold text-[#3a3240]">{item.quantity}</span> {item.food.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#5f586d]">
                      <MapPin className="h-4 w-4 shrink-0 text-[#7655aa]" />
                      <span>{item.location}</span>
                    </div>
                    <div className={`col-span-2 flex items-center gap-2 ${isExpired ? "text-red-600" : isSoon ? "text-orange-600" : "text-[#5f586d]"
                      }`}>
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>
                        HSD: <span className="font-semibold">{formatDate(item.expiry_date)}</span>
                        {isExpired
                          ? ` (đã hết hạn ${Math.abs(days)} ngày)`
                          : days === 0
                            ? " (hết hạn hôm nay)"
                            : ` (còn ${days} ngày)`}
                      </span>
                    </div>
                  </div>
                  {!deleteMode && (
                    <div className="mt-3 flex gap-2">
                      <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                        <Link to={`/fridge/edit/${item.fridge_item_id}`}><Edit className="mr-1 h-3 w-3" />Sửa</Link>
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setConsumeId(item.fridge_item_id); setConsumeQuantity(1); setDetailFoodId(null); }}>
                        <Utensils className="mr-1 h-3 w-3" />Dùng
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { setDeleteId(item.fridge_item_id); setDetailFoodId(null); }}>
                        <Trash2 className="mr-1 h-3 w-3" />Xóa
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FoodCard({
  item,
  deleteMode,
  selected,
  onToggleSelect,
  onDelete,
  hasDuplicate,
  onFoodNameClick,
}: {
  item: ReturnType<typeof useFridgeStore.getState>["items"][number];
  deleteMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  hasDuplicate?: boolean;
  onFoodNameClick?: () => void;
}) {
  return (
    <div
      className={`rounded-[8px] border bg-white p-4 transition ${deleteMode && selected ? "border-[#7655aa] bg-[#f3f0fb]" : ""}`}
      onClick={deleteMode ? onToggleSelect : undefined}
    >
      <div className="flex items-center justify-between">
        {deleteMode && (
          <Checkbox checked={selected} onCheckedChange={onToggleSelect} onClick={(e) => e.stopPropagation()} />
        )}
        {!deleteMode ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-left font-bold hover:text-[#7655aa] transition-colors"
            onClick={(e) => { e.stopPropagation(); onFoodNameClick?.(); }}
            title="Xem chi tiết HSD"
          >
            {item.food.icon} {item.food.food_name}
            {hasDuplicate && (
              <span className="ml-1 rounded-full bg-[#7655aa]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#7655aa]">
                Nhiều lô
              </span>
            )}
          </button>
        ) : (
          <b className={deleteMode ? "ml-2" : ""}>{item.food.icon} {item.food.food_name}</b>
        )}
        <span className="text-sm">{item.quantity} {item.food.unit}</span>
      </div>
      <div className="mt-2 text-sm text-[#746d82]">{item.food.category} · {item.location} · HSD {formatDate(item.expiry_date)}</div>
      {!deleteMode && (
        <div className="mt-3 flex gap-2">
          <Button asChild size="sm" variant="outline"><Link to={`/fridge/edit/${item.fridge_item_id}`}>Sửa</Link></Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>Xóa</Button>
        </div>
      )}
    </div>
  );
}
