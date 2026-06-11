import { CheckCircle2, Circle, Info, PackageCheck, Pencil, Plus, Trash2, X } from "lucide-react";
import { useT } from "@/shared/store/languageStore";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useShoppingStore } from "@/modules/shopping/store/shoppingStore";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { AppModal } from "@/shared/components/AppModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fridgeApi, type FridgeRow } from "@/modules/fridge/api/fridgeApi";
import { foodApi } from "@/shared/api/foodApi";
import { formatDate } from "@/shared/utils/date";
import type { Food, ShoppingListItem } from "@/types";

type DetailedItem = ShoppingListItem & { food: Food };

type GroupedItem = {
  food_name: string;
  icon: string;
  category: string;
  unit: string;
  totalRequired: number;
  totalBought: number;
  items: DetailedItem[];
};

export function ShoppingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const family = useAuthStore((state) => state.family)!;
  const { lists, loadDetail, recordPurchase, deleteItems, deleteList, complete, addItem, updateItem } =
    useShoppingStore();

  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailGroup, setDetailGroup] = useState<GroupedItem | null>(null);
  const [fridgeItems, setFridgeItems] = useState<FridgeRow[]>([]);

  // edit item quantity
  const [editOpen, setEditOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);

  // add item
  const [addOpen, setAddOpen] = useState(false);
  const [addFoodId, setAddFoodId] = useState("");
  const [addQuantity, setAddQuantity] = useState(1);
  const [foods, setFoods] = useState<Food[]>([]);

  const t = useT();
  const list = lists.find((item) => item.shopping_list_id === id);
  const allCompleted = useMemo(
    () => Boolean(list?.items.length) && list!.items.every((item) => item.item_status === "COMPLETED"),
    [list],
  );

  useEffect(() => {
    if (id) void loadDetail(id, family.family_id);
    void fridgeApi.list(family.family_id).then(setFridgeItems);
    void foodApi.list().then(setFoods);
  }, [family.family_id, id, loadDetail]);

  const grouped: GroupedItem[] = useMemo(() => {
    if (!list) return [];
    const map = new Map<string, GroupedItem>();
    for (const item of list.items) {
      const key = item.food.food_name;
      if (!map.has(key)) {
        map.set(key, {
          food_name: item.food.food_name,
          icon: item.food.icon ?? "🛒",
          category: item.food.category,
          unit: item.food.unit,
          totalRequired: 0,
          totalBought: 0,
          items: [],
        });
      }
      const g = map.get(key)!;
      g.totalRequired += item.quantity;
      g.totalBought += item.bought_quantity ?? 0;
      g.items.push(item);
    }
    return Array.from(map.values());
  }, [list?.items]);

  if (!list) return <ScreenHeader title="Đang tải danh sách" />;

  function groupStatus(g: GroupedItem) {
    if (g.items.every((i) => i.item_status === "COMPLETED")) return "COMPLETED";
    if (g.items.some((i) => i.item_status === "PARTIAL" || i.item_status === "COMPLETED")) return "PARTIAL";
    return "PENDING";
  }

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
    setDeleteOpen(true);
  }

  function toggleSelect(itemIds: string[]) {
    setSelectedIds((prev) => {
      const allSelected = itemIds.every((id) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !itemIds.includes(id));
      return [...new Set([...prev, ...itemIds])];
    });
  }

  function openEditItem(itemId: string, currentQty: number) {
    setEditingItemId(itemId);
    setEditQuantity(currentQty);
    setEditOpen(true);
  }

  async function confirmItem() {
    if (!checkingId || !list) return;
    setSubmitting(true);
    try {
      await recordPurchase(checkingId, quantity, family.family_id, id);
      const item = list.items.find((row) => row.id === checkingId);
      const status = quantity >= (item?.quantity ?? 0) ? "completed" : "partial";
      toast.success(`Đã cập nhật ${status}. Inventory +${quantity}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật mặt hàng.");
    } finally {
      setSubmitting(false);
      setCheckingId(null);
    }
  }

  async function confirmEdit() {
    if (!editingItemId || !list) return;
    setSubmitting(true);
    try {
      await updateItem(list.shopping_list_id, editingItemId, editQuantity, family.family_id);
      toast.success("Đã cập nhật định lượng cần mua.");
      setEditOpen(false);
      setEditingItemId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmAdd() {
    if (!addFoodId || !list) return;
    if (addQuantity <= 0) return toast.error("Số lượng phải lớn hơn 0.");
    setSubmitting(true);
    try {
      await addItem(list.shopping_list_id, { food_id: addFoodId, quantity: addQuantity }, family.family_id);
      toast.success("Đã thêm mặt hàng vào danh sách.");
      setAddOpen(false);
      setAddFoodId("");
      setAddQuantity(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thêm mặt hàng.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!selectedIds.length || !list) return;
    await deleteItems(list.shopping_list_id, selectedIds, family.family_id);
    setSelectedIds([]);
    setDeleteMode(false);
    toast.success("Đã xóa các mặt hàng đã chọn.");
  }

  async function confirmComplete() {
    if (!list) return;
    try {
      await complete(list.shopping_list_id, family.family_id);
      toast.success("Đã hoàn tất mua sắm và cập nhật tủ lạnh.");
      navigate("/fridge");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Danh sách còn mặt hàng partial hoặc pending.");
    }
  }

  async function confirmDeleteList() {
    if (!list) return;
    try {
      await deleteList(list.shopping_list_id, family.family_id);
      toast.success("Đã xóa danh sách mua sắm.");
      navigate("/shopping");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa danh sách.");
    }
  }

  const deleteButtonLabel = !deleteMode
    ? "Xóa"
    : selectedIds.length > 0
      ? `Xóa ${selectedIds.length} mục`
      : "Hủy chọn";

  const deleteButtonVariant = deleteMode && selectedIds.length > 0 ? "destructive" : "outline";

  return (
    <>
      <ScreenHeader
        title={list.title}
        subtitle={t("shoppingListSubtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            {deleteMode && (
              <span className="self-center text-sm font-semibold text-[#7655aa]">
                {selectedIds.length} đã chọn
              </span>
            )}
            {!deleteMode && (
              <Button
                variant="outline"
                className="border-[#7655aa] text-[#7655aa] hover:bg-[#f3f0fb]"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm mặt hàng
              </Button>
            )}
            <Button
              variant={deleteButtonVariant as "outline" | "destructive"}
              onClick={handleDeleteButtonClick}
              className={deleteMode && selectedIds.length === 0 ? "border-[#7655aa] text-[#7655aa]" : ""}
            >
              {deleteMode && selectedIds.length === 0 ? (
                <X className="mr-2 h-4 w-4" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {deleteButtonLabel}
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => void confirmDeleteList()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa list
            </Button>
            <Button
              disabled={!allCompleted || submitting}
              onClick={() => setCompleteOpen(true)}
              className="bg-[#31c875]"
            >
              <PackageCheck className="mr-2 h-4 w-4" />
              Hoàn tất
            </Button>
          </div>
        }
      />
      <section className="rounded-[8px] bg-white p-5 shadow-card">
        {deleteMode && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#f3f0fb] px-4 py-2 text-sm text-[#7655aa]">
            <Checkbox
              checked={selectedIds.length === list.items.length && list.items.length > 0}
              onCheckedChange={(checked) =>
                setSelectedIds(checked ? list.items.map((i) => i.id) : [])
              }
            />
            <span className="font-medium">Chọn tất cả ({list.items.length} mặt hàng)</span>
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {grouped.map((group) => {
            const status = groupStatus(group);
            const groupItemIds = group.items.map((i) => i.id);
            const allGroupSelected = groupItemIds.every((id) => selectedIds.includes(id));
            const someGroupSelected = groupItemIds.some((id) => selectedIds.includes(id));
            return (
              <div
                key={group.food_name}
                className={`flex items-center gap-3 rounded-[8px] border p-4 transition ${
                  status === "COMPLETED"
                    ? "bg-[#f1f3f7]"
                    : deleteMode && someGroupSelected
                      ? "border-[#7655aa] bg-[#f3f0fb]"
                      : "bg-white hover:border-[#7655aa]"
                }`}
              >
                {deleteMode && (
                  <Checkbox
                    checked={allGroupSelected}
                    onCheckedChange={() => toggleSelect(groupItemIds)}
                    className="shrink-0"
                  />
                )}
                <button
                  className="flex flex-1 items-center gap-3 text-left"
                  onClick={() => {
                    if (deleteMode) {
                      toggleSelect(groupItemIds);
                      return;
                    }
                    if (group.items.length === 1) {
                      setCheckingId(group.items[0].id);
                      setQuantity(group.items[0].bought_quantity ?? group.items[0].quantity);
                    } else {
                      setDetailGroup(group);
                    }
                  }}
                >
                  {status === "COMPLETED" ? (
                    <CheckCircle2 className="shrink-0 text-[#31c875]" />
                  ) : (
                    <Circle
                      className={`shrink-0 ${status === "PARTIAL" ? "text-[#ffad1f]" : "text-[#9188a1]"}`}
                    />
                  )}
                  <span className="text-xl">{group.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <b className="truncate">{group.food_name}</b>
                      {group.items.length > 1 && (
                        <span className="shrink-0 rounded-full bg-[#7655aa] px-2 py-0.5 text-xs font-bold text-white">
                          ×{group.items.length}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#746d82]">
                      Cần {group.totalRequired} {group.unit} · Đã mua {group.totalBought} {group.unit} ·{" "}
                      {group.category} · {t(`shoppingStatus_${status}` as Parameters<typeof t>[0])}
                    </p>
                  </div>
                  {!deleteMode && group.items.length > 1 && (
                    <Info className="h-4 w-4 shrink-0 text-[#9188a1]" />
                  )}
                </button>
                {/* Edit quantity button — single-item group only */}
                {!deleteMode && group.items.length === 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditItem(group.items[0].id, group.items[0].quantity);
                    }}
                    className="shrink-0 rounded p-1 text-[#9188a1] hover:bg-[#f3f0fb] hover:text-[#7655aa]"
                    title="Sửa định lượng cần mua"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Confirm purchase modal (single item) */}
      <AppModal
        open={Boolean(checkingId)}
        onOpenChange={(open) => !open && setCheckingId(null)}
        type="confirm"
        title="Số lượng đã mua"
        primaryLabel={submitting ? "Đang cập nhật..." : "Xác nhận"}
        secondaryLabel="Hủy"
        onPrimary={confirmItem}
      >
        <Input
          min={0.01}
          step="0.01"
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
        />
      </AppModal>

      {/* Edit required quantity modal */}
      <AppModal
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) { setEditOpen(false); setEditingItemId(null); }
        }}
        type="confirm"
        title="Sửa định lượng cần mua"
        primaryLabel={submitting ? "Đang lưu..." : "Lưu"}
        secondaryLabel="Hủy"
        onPrimary={confirmEdit}
      >
        <div className="space-y-2">
          <p className="text-sm text-[#746d82]">Nhập định lượng cần mua mới:</p>
          <Input
            min={0.01}
            step="0.01"
            type="number"
            value={editQuantity}
            onChange={(e) => setEditQuantity(Number(e.target.value))}
          />
        </div>
      </AppModal>

      {/* Add item modal */}
      <AppModal
        open={addOpen}
        onOpenChange={(open) => {
          if (!open) { setAddOpen(false); setAddFoodId(""); setAddQuantity(1); }
        }}
        type="confirm"
        title="Thêm mặt hàng vào danh sách"
        primaryLabel={submitting ? "Đang thêm..." : "Thêm"}
        secondaryLabel="Hủy"
        onPrimary={confirmAdd}
      >
        <div className="space-y-3">
          <Select value={addFoodId} onValueChange={setAddFoodId}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn thực phẩm" />
            </SelectTrigger>
            <SelectContent>
              {foods.map((food) => (
                <SelectItem key={food.food_id} value={food.food_id}>
                  {food.icon} {food.food_name} · {food.category} · {food.unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            min={0.01}
            step="0.01"
            type="number"
            value={addQuantity}
            onChange={(e) => setAddQuantity(Number(e.target.value))}
            placeholder="Số lượng"
          />
        </div>
      </AppModal>

      {/* Delete items confirm modal */}
      <AppModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        type="confirm"
        title="Xóa các mặt hàng đã chọn?"
        primaryLabel="Xóa"
        secondaryLabel="Hủy"
        onPrimary={confirmDelete}
      >
        Hành động này sẽ xóa {selectedIds.length} mặt hàng khỏi danh sách.
      </AppModal>

      {/* Complete confirm modal */}
      <AppModal
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        type="confirm"
        title="Hoàn tất mua sắm?"
        primaryLabel="Hoàn tất"
        secondaryLabel="Tiếp tục"
        onPrimary={confirmComplete}
      >
        {t("completeConfirm")}
      </AppModal>

      {/* Grouped item detail popup */}
      {detailGroup && (
        <GroupedItemModal
          group={detailGroup}
          fridgeItems={fridgeItems}
          onClose={() => setDetailGroup(null)}
          onSelectItem={(itemId, qty) => {
            setDetailGroup(null);
            setCheckingId(itemId);
            setQuantity(qty);
          }}
          onEditItem={(itemId, qty) => {
            setDetailGroup(null);
            openEditItem(itemId, qty);
          }}
        />
      )}
    </>
  );
}

function GroupedItemModal({
  group,
  fridgeItems,
  onClose,
  onSelectItem,
  onEditItem,
}: {
  group: GroupedItem;
  fridgeItems: FridgeRow[];
  onClose: () => void;
  onSelectItem: (itemId: string, qty: number) => void;
  onEditItem: (itemId: string, currentQty: number) => void;
}) {
  const t = useT();
  const fridgeMatches = fridgeItems.filter(
    (f) => f.food.food_name.toLowerCase() === group.food_name.toLowerCase(),
  );

  const statusColor = {
    COMPLETED: "bg-[#d4f7e6] text-[#1a7a47]",
    PARTIAL: "bg-[#fff3d0] text-[#8a5c00]",
    PENDING: "bg-[#f0ecfb] text-[#7655aa]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-3 rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{group.icon}</span>
            <div>
              <h2 className="text-lg font-extrabold text-[#252033]">{group.food_name}</h2>
              <div className="mt-0.5 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f0ecfb] px-3 py-0.5 text-xs font-semibold text-[#7655aa]">
                  {group.category}
                </span>
                <span className="rounded-full bg-[#e8f4fd] px-3 py-0.5 text-xs font-semibold text-[#3488ed]">
                  {group.unit}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f4f6] text-[#9188a1] transition hover:bg-[#e8e4f0] hover:text-[#3d3051]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-px bg-[#f0ecfb] text-center text-xs">
          <div className="bg-white py-3">
            <div className="text-lg font-extrabold text-[#252033]">{group.totalRequired}</div>
            <div className="text-[#9188a1]">Tổng cần</div>
          </div>
          <div className="bg-white py-3">
            <div className="text-lg font-extrabold text-[#31c875]">{group.totalBought}</div>
            <div className="text-[#9188a1]">Đã mua</div>
          </div>
          <div className="bg-white py-3">
            <div className="text-lg font-extrabold text-[#ffad1f]">
              {Math.max(0, group.totalRequired - group.totalBought)}
            </div>
            <div className="text-[#9188a1]">Còn lại</div>
          </div>
        </div>

        {/* Fridge expiry info */}
        {fridgeMatches.length > 0 && (
          <div className="mx-5 mt-4 rounded-xl border border-[#ffd580] bg-[#fffbea] px-4 py-3">
            <p className="mb-1.5 text-xs font-bold text-[#8a5c00]">📦 Đang có trong tủ lạnh:</p>
            <div className="space-y-1">
              {fridgeMatches.map((f) => (
                <div key={f.fridge_item_id} className="flex items-center justify-between text-xs">
                  <span className="text-[#5f4a00]">
                    {f.quantity} {f.food.unit} · {f.location}
                  </span>
                  <span className="font-semibold text-[#8a5c00]">
                    HSD: {formatDate(f.expiry_date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {fridgeMatches.length === 0 && (
          <div className="mx-5 mt-4 rounded-xl border border-[#e8e4f0] bg-[#f8f6fb] px-4 py-3 text-xs text-[#9188a1]">
            Không có trong tủ lạnh hiện tại.
          </div>
        )}

        {/* Sub-items list */}
        <div className="max-h-60 overflow-y-auto px-5 pb-2 pt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9188a1]">
            Chi tiết từng mục ({group.items.length})
          </p>
          <div className="space-y-2">
            {group.items.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
              >
                <span className="text-[#9188a1]">#{idx + 1}</span>
                <button
                  onClick={() => onSelectItem(item.id, item.bought_quantity ?? item.quantity)}
                  className="flex flex-1 items-start gap-2 text-left transition hover:text-[#7655aa]"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-[#252033]">
                      Cần {item.quantity} {group.unit} · Mua {item.bought_quantity ?? 0} {group.unit} · Còn{" "}
                      {item.remaining_quantity ?? item.quantity} {group.unit}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${statusColor[item.item_status ?? "PENDING"]}`}
                  >
                    {t(`shoppingStatus_${item.item_status ?? "PENDING"}` as Parameters<typeof t>[0])}
                  </span>
                </button>
                <button
                  onClick={() => onEditItem(item.id, item.quantity)}
                  className="shrink-0 rounded p-1 text-[#9188a1] hover:bg-[#f3f0fb] hover:text-[#7655aa]"
                  title="Sửa định lượng"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t px-5 py-4">
          <Button variant="outline" className="w-full rounded-xl" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
