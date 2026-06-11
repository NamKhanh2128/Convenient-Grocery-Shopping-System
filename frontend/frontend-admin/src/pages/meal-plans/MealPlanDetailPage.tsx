import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Save,
  ArrowLeft,
  Loader2,
  CalendarDays,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  adminMealPlanApi,
  type MealPlanWithItems,
  type MealPlanItemWithMeta,
  type MealPlanRecipe,
  type MealPlanUpdatePayload,
  type MealPlanItemUpdatePayload,
} from "@/api/adminMealPlanApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Schema-backed constants ───────────────────────────────────────────────────
// meal_plans.plan_type: e.g. 'daily', 'weekly'
const PLAN_TYPE_OPTIONS = [
  { value: "daily", label: "Hàng ngày" },
  { value: "weekly", label: "Hàng tuần" },
];

// meal_plans.status: e.g. 'draft', 'active', 'completed'
const STATUS_OPTIONS = [
  { value: "draft", label: "Nháp" },
  { value: "active", label: "Đang thực hiện" },
  { value: "completed", label: "Hoàn thành" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

// meal_plan_items.meal_type: e.g. 'breakfast', 'lunch', 'dinner', 'snack'
const MEAL_TYPE_OPTIONS = [
  { value: "breakfast", label: "Sáng" },
  { value: "lunch", label: "Trưa" },
  { value: "dinner", label: "Tối" },
  { value: "snack", label: "Bữa phụ" },
];

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Sáng",
  lunch: "Trưa",
  dinner: "Tối",
  snack: "Bữa phụ",
};

export function MealPlanDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [plan, setPlan] = useState<MealPlanWithItems | null>(null);
  const [recipes, setRecipes] = useState<MealPlanRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields — mirrors schema columns for meal_plans
  const [formPlanType, setFormPlanType] = useState("weekly");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStatus, setFormStatus] = useState<string | null>(null);

  // Item action state
  const [deleteItemTarget, setDeleteItemTarget] = useState<MealPlanItemWithMeta | null>(null);
  const [itemActionLoading, setItemActionLoading] = useState(false);

  const applyFormFromPlan = (data: MealPlanWithItems) => {
    setFormPlanType(data.plan_type);
    setFormStartDate(data.start_date ? data.start_date.slice(0, 10) : "");
    setFormEndDate(data.end_date ? data.end_date.slice(0, 10) : "");
    setFormStatus(data.status ?? null);
  };

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [planData, recipesData] = await Promise.all([
        adminMealPlanApi.getById(Number(id)),
        adminMealPlanApi.getRecipes(),
      ]);
      setPlan(planData);
      setRecipes(recipesData);
      applyFormFromPlan(planData);
    } catch {
      toast.error("Không thể tải thông tin kế hoạch bữa ăn.");
      navigate("/meal-plans");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Save plan header ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const payload: MealPlanUpdatePayload = {
        plan_type: formPlanType,
        start_date: formStartDate || undefined,
        end_date: formEndDate || undefined,
        status: formStatus,
      };
      const updated = await adminMealPlanApi.update(Number(id), payload);
      setPlan(updated);
      applyFormFromPlan(updated);
      toast.success("Cập nhật kế hoạch bữa ăn thành công!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle is_cooked ────────────────────────────────────────────────────────
  const handleToggleCooked = async (item: MealPlanItemWithMeta, value: boolean) => {
    if (!id) return;
    try {
      const payload: MealPlanItemUpdatePayload = { is_cooked: value };
      const updated = await adminMealPlanApi.updateItem(Number(id), item.id, payload);
      setPlan(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    }
  };

  // ── Update item meal_type ───────────────────────────────────────────────────
  const handleItemMealTypeChange = async (item: MealPlanItemWithMeta, value: string) => {
    if (!id) return;
    try {
      const payload: MealPlanItemUpdatePayload = { meal_type: value };
      const updated = await adminMealPlanApi.updateItem(Number(id), item.id, payload);
      setPlan(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    }
  };

  // ── Update item recipe ──────────────────────────────────────────────────────
  const handleItemRecipeChange = async (item: MealPlanItemWithMeta, value: string) => {
    if (!id) return;
    try {
      const payload: MealPlanItemUpdatePayload = { recipe_id: Number(value) };
      const updated = await adminMealPlanApi.updateItem(Number(id), item.id, payload);
      setPlan(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    }
  };

  // ── Delete item ─────────────────────────────────────────────────────────────
  const handleDeleteItem = async () => {
    if (!id || !deleteItemTarget) return;
    setItemActionLoading(true);
    try {
      const updated = await adminMealPlanApi.deleteItem(Number(id), deleteItemTarget.id);
      setPlan(updated);
      toast.success("Đã xóa bữa ăn khỏi kế hoạch.");
      setDeleteItemTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    } finally {
      setItemActionLoading(false);
    }
  };

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns: Column<MealPlanItemWithMeta>[] = useMemo(
    () => [
      {
        key: "is_cooked",
        header: "Đã nấu",
        width: "80px",
        render: (item) => (
          <button
            type="button"
            title={item.is_cooked ? "Đánh dấu chưa nấu" : "Đánh dấu đã nấu"}
            onClick={() => handleToggleCooked(item, !item.is_cooked)}
            className="flex items-center justify-center h-8 w-8 rounded-lg transition hover:bg-accent"
          >
            {item.is_cooked ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40" />
            )}
          </button>
        ),
      },
      {
        key: "meal_date",
        header: "Ngày bữa ăn",
        render: (item) => (
          <span className="text-xs font-bold text-foreground">
            {item.meal_date
              ? new Date(item.meal_date).toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })
              : "—"}
          </span>
        ),
      },
      {
        key: "meal_type",
        header: "Bữa",
        render: (item) => (
          <Select
            value={item.meal_type}
            onValueChange={(value) => handleItemMealTypeChange(item, value)}
          >
            <SelectTrigger className="h-8 w-[110px] text-xs font-semibold">
              <SelectValue>{MEAL_TYPE_LABELS[item.meal_type] ?? item.meal_type}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MEAL_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "recipe_name",
        header: "Công thức",
        render: (item) => (
          <Select
            value={String(item.recipe_id)}
            onValueChange={(value) => handleItemRecipeChange(item, value)}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs font-semibold">
              <SelectValue>{item.recipe_name ?? "—"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {recipes.map((r) => (
                <SelectItem key={r.id} value={String(r.id)} className="text-xs font-medium">
                  {r.name_vi || r.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "created_at",
        header: "Ngày tạo",
        render: (item) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {item.created_at ? new Date(item.created_at).toLocaleDateString("vi-VN") : "—"}
          </span>
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
            title="Xóa bữa ăn"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [id, recipes]
  );

  // ── Breadcrumbs ─────────────────────────────────────────────────────────────
  const breadcrumbs = [
    { label: "Kế hoạch bữa ăn", to: "/meal-plans" },
    { label: plan ? `#${plan.id} — ${plan.user_name ?? "—"}` : "Chi tiết" },
  ];

  // ── Loading skeleton ────────────────────────────────────────────────────────
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

  if (!plan) return null;

  const statusColor =
    plan.status
      ? STATUS_COLORS[plan.status] ?? "bg-slate-500/10 text-slate-600 border-slate-500/20"
      : "bg-slate-500/10 text-slate-600 border-slate-500/20";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Kế hoạch bữa ăn #${plan.id}`}
        description={`Người dùng: ${plan.user_name ?? "—"}${plan.user_email ? ` · ${plan.user_email}` : ""}`}
        breadcrumbs={breadcrumbs}
        actions={
          <Button
            variant="outline"
            className="rounded-[8px] h-10 px-4 flex items-center gap-1.5"
            onClick={() => navigate("/meal-plans")}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        }
      />

      {/* ── Plan header form ─────────────────────────────────────────────────── */}
      <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center gap-3">
          <div className="p-2 rounded-xl text-white bg-[#7655aa]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Thông tin kế hoạch</CardTitle>
            <CardDescription className="text-xs">
              Cập nhật loại kế hoạch, ngày bắt đầu / kết thúc, và trạng thái.
            </CardDescription>
          </div>
          <div className="ml-auto">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusColor}`}>
              {STATUS_OPTIONS.find((o) => o.value === plan.status)?.label ?? plan.status ?? "—"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* plan_type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Loại kế hoạch
              </Label>
              <Select value={formPlanType} onValueChange={setFormPlanType}>
                <SelectTrigger className="h-10 rounded-[8px] font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Trạng thái
              </Label>
              <Select
                value={formStatus ?? ""}
                onValueChange={(v) => setFormStatus(v || null)}
              >
                <SelectTrigger className="h-10 rounded-[8px] font-sans">
                  <SelectValue placeholder="Chọn trạng thái" />
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

            {/* start_date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Ngày bắt đầu
              </Label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="flex h-10 w-full rounded-[8px] border border-input bg-background px-3 py-2 text-sm font-sans ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* end_date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Ngày kết thúc
              </Label>
              <input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="flex h-10 w-full rounded-[8px] border border-input bg-background px-3 py-2 text-sm font-sans ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Save button */}
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

      {/* ── Meal plan items table ─────────────────────────────────────────────── */}
      <Card className="rounded-[20px] border-border/50 bg-card shadow-card overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold">
            Các bữa ăn trong kế hoạch ({plan.cooked_count}/{plan.item_count} đã nấu)
          </CardTitle>
          <CardDescription className="text-xs">
            Theo dõi tiến độ nấu ăn và cập nhật từng bữa trong kế hoạch.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <DataTable
            data={plan.items}
            columns={columns}
            getRowId={(row) => String(row.id)}
            emptyMessage="Kế hoạch này chưa có bữa ăn nào."
          />
        </CardContent>
      </Card>

      {/* ── Delete item confirmation ──────────────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deleteItemTarget)}
        onOpenChange={(open) => !open && setDeleteItemTarget(null)}
        title={`Xóa bữa "${MEAL_TYPE_LABELS[deleteItemTarget?.meal_type ?? ""] ?? deleteItemTarget?.meal_type}" ngày ${deleteItemTarget?.meal_date ? new Date(deleteItemTarget.meal_date).toLocaleDateString("vi-VN") : "—"}?`}
        description="Bữa ăn này sẽ bị xóa vĩnh viễn khỏi kế hoạch."
        primaryLabel="Xóa bữa ăn"
        type="destructive"
        onConfirm={handleDeleteItem}
        isLoading={itemActionLoading}
      />
    </div>
  );
}

export default MealPlanDetailPage;
