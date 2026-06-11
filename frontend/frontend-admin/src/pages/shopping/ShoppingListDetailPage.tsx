import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Save, ArrowLeft, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import {
  adminShoppingApi,
  type ShoppingListWithItems,
  type ShoppingListItemWithMeta,
  type ShoppingUser,
} from "@/api/adminShoppingApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "active", label: "Đang thực hiện" },
  { value: "completed", label: "Hoàn thành" },
];

const ITEM_STATUS_OPTIONS = [
  { value: "pending", label: "Chưa mua" },
  { value: "partial", label: "Mua một phần" },
  { value: "done", label: "Đã mua xong" },
];

const NONE_USER = "NONE";

export function ShoppingListDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [list, setList] = useState<ShoppingListWithItems | null>(null);
  const [users, setUsers] = useState<ShoppingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const [formPlanDate, setFormPlanDate] = useState("");
  const [formAssignedUserId, setFormAssignedUserId] = useState<string>(NONE_USER);

  const [deleteItemTarget, setDeleteItemTarget] = useState<ShoppingListItemWithMeta | null>(null);
  const [itemActionLoading, setItemActionLoading] = useState(false);

  const applyFormFromList = (data: ShoppingListWithItems) => {
    setFormName(data.name);
    setFormStatus(data.status ?? "active");
    setFormPlanDate(data.plan_date ? data.plan_date.slice(0, 10) : "");
    setFormAssignedUserId(data.assigned_user_id ? String(data.assigned_user_id) : NONE_USER);
  };

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [listData, usersData] = await Promise.all([
        adminShoppingApi.getById(Number(id)),
        adminShoppingApi.getUsers(),
      ]);
      setList(listData);
      setUsers(usersData);
      applyFormFromList(listData);
    } catch (error) {
      toast.error("Không thể tải thông tin danh sách mua sắm.");
      navigate("/shopping-lists");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await adminShoppingApi.update(Number(id), {
        name: formName,
        status: formStatus,
        plan_date: formPlanDate ? formPlanDate : null,
        assigned_user_id: formAssignedUserId === NONE_USER ? null : Number(formAssignedUserId),
      });
      setList(updated);
      applyFormFromList(updated);
      toast.success("Cập nhật danh sách mua sắm thành công!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePurchased = async (item: ShoppingListItemWithMeta, checked: boolean) => {
    if (!id) return;
    try {
      const updated = await adminShoppingApi.updateItem(Number(id), item.id, { is_purchased: checked });
      setList(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    }
  };

  const handleItemStatusChange = async (item: ShoppingListItemWithMeta, value: string) => {
    if (!id) return;
    try {
      const updated = await adminShoppingApi.updateItem(Number(id), item.id, { item_status: value });
      setList(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    }
  };

  const handleDeleteItem = async () => {
    if (!id || !deleteItemTarget) return;
    setItemActionLoading(true);
    try {
      const updated = await adminShoppingApi.deleteItem(Number(id), deleteItemTarget.id);
      setList(updated);
      toast.success(`Đã xóa mục "${deleteItemTarget.name}" khỏi danh sách.`);
      setDeleteItemTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    } finally {
      setItemActionLoading(false);
    }
  };

  const columns: Column<ShoppingListItemWithMeta>[] = useMemo(
    () => [
      {
        key: "is_purchased",
        header: "Đã mua",
        width: "70px",
        render: (item) => (
          <Checkbox
            checked={item.is_purchased ?? false}
            onCheckedChange={(checked) => handleTogglePurchased(item, !!checked)}
          />
        ),
      },
      {
        key: "name",
        header: "Tên mục",
        render: (item) => <span className="font-bold text-sm text-foreground">{item.name}</span>,
      },
      {
        key: "quantity",
        header: "Số lượng",
        render: (item) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {item.quantity} {item.unit_symbol ?? ""}
          </span>
        ),
      },
      {
        key: "category_name_vi",
        header: "Danh mục",
        render: (item) => (
          <span className="text-xs font-semibold text-muted-foreground">{item.category_name_vi ?? "—"}</span>
        ),
      },
      {
        key: "item_status",
        header: "Trạng thái mục",
        render: (item) => (
          <Select value={item.item_status ?? "pending"} onValueChange={(value) => handleItemStatusChange(item, value)}>
            <SelectTrigger className="h-8 w-[140px] text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEM_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "purchased_by_name",
        header: "Người mua",
        render: (item) => (
          <span className="text-xs font-semibold text-muted-foreground">{item.purchased_by_name ?? "—"}</span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        render: (item) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/15"
            onClick={() => setDeleteItemTarget(item)}
            title="Xóa mục"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [id]
  );

  const breadcrumbs = [
    { label: "Danh sách mua sắm", to: "/shopping-lists" },
    { label: list?.name ?? "Chi tiết" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40">
          <div className="h-4 w-1/3 rounded-lg bg-muted mb-2" />
          <div className="h-8 w-2/3 rounded-lg bg-muted mb-2" />
          <div className="h-3 w-1/2 rounded-lg bg-muted" />
        </div>
        <div className="rounded-[20px] bg-card/60 p-6 shadow-card border border-border/40 h-[200px]" />
      </div>
    );
  }

  if (!list) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={list.name}
        description={`Danh sách mua sắm của ${list.user_name ?? "—"}${list.group_name ? ` · ${list.group_name}` : ""}`}
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            variant="outline"
            className="rounded-[8px] h-10 px-4 flex items-center gap-1.5"
            onClick={() => navigate("/shopping-lists")}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        }
      />

      <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center gap-3">
          <div className="p-2 rounded-xl text-white bg-primary">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Thông tin danh sách</CardTitle>
            <CardDescription className="text-xs">
              Cập nhật tên, trạng thái, ngày dự kiến và người được giao cho danh sách này.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tên danh sách
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-10 rounded-[8px] font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Trạng thái
              </Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger className="h-10 rounded-[8px] font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Ngày dự kiến
              </Label>
              <Input
                type="date"
                value={formPlanDate}
                onChange={(e) => setFormPlanDate(e.target.value)}
                className="h-10 rounded-[8px] font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Người được giao
              </Label>
              <Select value={formAssignedUserId} onValueChange={setFormAssignedUserId}>
                <SelectTrigger className="h-10 rounded-[8px] font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_USER}>Không giao</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.full_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-border/40">
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#7655aa] hover:bg-[#67489a] font-bold rounded-[8px] text-white flex items-center gap-1.5 h-10 px-5 transition-all duration-200"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Save className="h-4 w-4 text-white" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold">
            Các mục trong danh sách ({list.purchased_count}/{list.item_count})
          </CardTitle>
          <CardDescription className="text-xs">
            Theo dõi tiến độ mua sắm và cập nhật trạng thái từng mục.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            data={list.items}
            columns={columns}
            getRowId={(row) => String(row.id)}
            emptyMessage="Danh sách này chưa có mục nào."
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteItemTarget)}
        onOpenChange={(open) => !open && setDeleteItemTarget(null)}
        title={`Xóa mục "${deleteItemTarget?.name}"?`}
        description="Mục này sẽ bị xóa vĩnh viễn khỏi danh sách mua sắm."
        primaryLabel="Xóa mục"
        type="destructive"
        onConfirm={handleDeleteItem}
        isLoading={itemActionLoading}
      />
    </div>
  );
}
export default ShoppingListDetailPage;
