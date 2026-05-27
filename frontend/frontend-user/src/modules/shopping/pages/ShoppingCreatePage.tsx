import { Plus, Share2, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/modules/auth/store/authStore";
import { useShoppingStore } from "@/modules/shopping/store/shoppingStore";
import { FlowSteps } from "@/shared/components/FlowSteps";
import { ScreenHeader } from "@/shared/components/ScreenHeader";
import { AppModal } from "@/shared/components/AppModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { foodApi } from "@/shared/api/foodApi";
import { familyApi } from "@/modules/family/api/familyApi";
import type { Food, ShoppingType, User, FoodUnit, FoodCategory } from "@/types";
import { type ShoppingCreateItem } from "@/modules/shopping/api/shoppingApi";
import { todayIso } from "@/shared/utils/date";

type SelectSectionRow = {
  food_id: string;
  quantity: number;
  custom_food_name?: string;
  unit?: FoodUnit;
  category?: FoodCategory;
};

export function ShoppingCreatePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user)!;
  const family = useAuthStore((state) => state.family)!;
  const create = useShoppingStore((state) => state.create);
  const [foods, setFoods] = useState<Food[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [title, setTitle] = useState("");
  const [listType, setListType] = useState<ShoppingType>("daily");
  const [planDate, setPlanDate] = useState(todayIso());
  const [rows, setRows] = useState<SelectSectionRow[]>([{ food_id: "", quantity: 1 }]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [validationOpen, setValidationOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedListId, setSavedListId] = useState<string | null>(null);

  useEffect(() => {
    void foodApi.list().then(setFoods);
    void familyApi.detail(family.family_id).then((data) => {
      setMembers(data.members);
      setSelectedMemberIds(data.members.map((member) => member.user_id));
    });
  }, [family.family_id]);

  function updateRow(index: number, patch: Partial<SelectSectionRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { food_id: "", quantity: 1 }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function buildItems(): ShoppingCreateItem[] {
    return rows
      .filter((row) => row.food_id)
      .map((row) => {
        if (row.food_id === "other") {
          return {
            food_name: row.custom_food_name || "Thực phẩm khác",
            quantity: row.quantity,
            unit: row.unit || "g",
            category: row.category || "Khác",
          };
        }
        return {
          food_id: row.food_id,
          quantity: row.quantity,
        };
      });
  }

  async function saveList() {
    if (rows.some((row) => row.food_id === "other" && !row.custom_food_name?.trim())) {
      return toast.error("Vui lòng nhập tên thực phẩm cho các lựa chọn khác.");
    }
    const allItems = buildItems();
    if (allItems.length === 0) return setValidationOpen(true);
    if (!title.trim()) return toast.error("Nhập tên danh sách.");
    if (allItems.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
      return toast.error("Số lượng phải lớn hơn 0.");
    }
    setSubmitting(true);
    try {
      await create({
        family_id: family.family_id,
        title,
        list_type: listType,
        plan_date: planDate,
        created_by: user.user_id,
        items: allItems,
        share_member_ids: members.length ? selectedMemberIds : undefined,
      });
      toast.success("Tạo danh sách thành công");
      setSavedListId("saved");
      if (members.length > 1) setShareOpen(true);
      else navigate("/shopping");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo danh sách.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleShare() {
    if (!savedListId) {
      toast.error("Lưu danh sách trước khi chia sẻ.");
      return;
    }
    setShareOpen(true);
  }

  return (
    <>
      <ScreenHeader title="Tạo danh sách mua sắm" subtitle="Chọn thực phẩm từ danh sách có sẵn." />
      <section className="rounded-[8px] bg-white p-6 shadow-card">
        <FlowSteps steps={["Chọn kiểu", "Thêm mặt hàng", "Lưu danh sách", "Chia sẻ"]} current={2} />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề danh sách" />
          <Select value={listType} onValueChange={(value) => setListType(value as ShoppingType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Theo ngày</SelectItem>
              <SelectItem value="weekly">Theo tuần</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
        </div>

        <div className="mt-5 space-y-3">
          <h3 className="font-bold">Chọn thực phẩm</h3>
          {rows.map((row, index) => {
            const food = foods.find((item) => item.food_id === row.food_id);
            return (
              <div key={index} className="grid gap-3 md:grid-cols-[1fr_150px_170px_80px]">
                {row.food_id === "other" ? (
                  <div className="flex gap-2 w-full">
                    <Input
                      value={row.custom_food_name || ""}
                      onChange={(e) => updateRow(index, { custom_food_name: e.target.value })}
                      placeholder="Nhập tên thực phẩm..."
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 h-10 text-xs text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => updateRow(index, { food_id: "", custom_food_name: "" })}
                    >
                      Chọn lại
                    </Button>
                  </div>
                ) : (
                  <Select value={row.food_id} onValueChange={(value) => updateRow(index, { food_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Chọn thực phẩm" /></SelectTrigger>
                    <SelectContent>
                      {foods.map((item) => (
                        <SelectItem key={item.food_id} value={item.food_id}>
                          {item.icon} {item.food_name}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">🧺 Khác...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Input
                  type="number"
                  value={row.quantity}
                  onChange={(e) => updateRow(index, { quantity: Number(e.target.value) })}
                />
                {row.food_id === "other" ? (
                  <div className="grid grid-cols-2 gap-1 h-10">
                    <Select
                      value={row.unit || "g"}
                      onValueChange={(val) => updateRow(index, { unit: val as FoodUnit })}
                    >
                      <SelectTrigger className="h-10 px-2 text-xs"><SelectValue placeholder="Đơn vị" /></SelectTrigger>
                      <SelectContent>
                        {["kg", "g", "lít", "ml", "quả", "củ", "miếng", "gói"].map((u) => (
                          <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={row.category || "Khác"}
                      onValueChange={(val) => updateRow(index, { category: val as FoodCategory })}
                    >
                      <SelectTrigger className="h-10 px-2 text-xs"><SelectValue placeholder="Danh mục" /></SelectTrigger>
                      <SelectContent>
                        {["Rau củ", "Thịt cá", "Đồ khô", "Sữa & Trứng", "Gia vị", "Khác"].map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Input value={food ? `${food.unit} · ${food.category}` : ""} readOnly placeholder="unit · category" />
                )}
                <Button variant="outline" onClick={() => removeRow(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          <Button variant="outline" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" />Thêm mặt hàng
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={saveList} disabled={submitting} className="bg-[#7655aa]">
            {submitting ? "Đang lưu..." : "Lưu danh sách"}
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={!savedListId}
            className={savedListId ? "border-[#7655aa] text-[#7655aa] hover:bg-[#f8f6fb]" : ""}
          >
            <Share2 className="mr-2 h-4 w-4" />Chia sẻ
          </Button>
          <Button variant="outline" onClick={() => navigate("/shopping")}>Hủy</Button>
        </div>
      </section>

      <AppModal
        open={validationOpen}
        onOpenChange={setValidationOpen}
        type="warning"
        title="Danh sách cần ít nhất 1 sản phẩm"
        secondaryLabel="Đóng"
      />
      <AppModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        type="confirm"
        title="Chia sẻ danh sách"
        primaryLabel="Chia sẻ"
        secondaryLabel="Bỏ qua"
        onPrimary={() => { toast.success("Đã chia sẻ danh sách cho các thành viên."); navigate("/shopping"); }}
        onSecondary={() => navigate("/shopping")}
      >
        <div className="space-y-2">
          {members.map((member) => (
            <label key={member.user_id} className="flex items-center gap-2 rounded-[8px] bg-[#f8f6fb] p-2">
              <Checkbox
                checked={selectedMemberIds.includes(member.user_id)}
                onCheckedChange={(checked) =>
                  setSelectedMemberIds((prev) =>
                    checked ? [...prev, member.user_id] : prev.filter((id) => id !== member.user_id),
                  )
                }
              />
              <Users className="h-4 w-4" /> {member.full_name}
            </label>
          ))}
        </div>
      </AppModal>
    </>
  );
}
