import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminMealPlanApi, type MealPlanSummary } from "@/api/adminMealPlanApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { FilterBar, type FilterConfig } from "@/components/shared/FilterBar";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp",
  active: "Đang thực hiện",
  completed: "Hoàn thành",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const PLAN_TYPE_LABELS: Record<string, string> = {
  daily: "Hàng ngày",
  weekly: "Hàng tuần",
};

export function MealPlanListPage() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState<MealPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<MealPlanSummary | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminMealPlanApi.list();
      setPlans(data);
    } catch (error) {
      toast.error("Không thể tải danh sách kế hoạch bữa ăn.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const filteredPlans = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return plans.filter((p) => {
      const matchesSearch =
        (p.user_name ?? "").toLowerCase().includes(q) ||
        (p.user_email ?? "").toLowerCase().includes(q);
      const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [plans, searchQuery, filterStatus]);

  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlans.slice(start, start + pageSize);
  }, [filteredPlans, currentPage, pageSize]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminMealPlanApi.delete(deleteTarget.id);
      toast.success(`Đã xóa kế hoạch bữa ăn của "${deleteTarget.user_name ?? "—"}" thành công!`);
      setDeleteTarget(null);
      await loadPlans();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      await adminMealPlanApi.bulkDelete(selectedIds.map(Number));
      toast.success(`Đã xóa thành công ${selectedIds.length} kế hoạch bữa ăn!`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      await loadPlans();
    } catch (error) {
      toast.error("Không thể xóa loạt kế hoạch bữa ăn.");
    } finally {
      setActionLoading(false);
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: "Trạng thái",
      value: filterStatus,
      onChange: setFilterStatus,
      options: [
        { label: "Tất cả trạng thái", value: "ALL" },
        { label: "Nháp", value: "draft" },
        { label: "Đang thực hiện", value: "active" },
        { label: "Hoàn thành", value: "completed" },
      ],
    },
  ];

  const columns: Column<MealPlanSummary>[] = useMemo(
    () => [
      {
        key: "plan_type",
        header: "Kế hoạch",
        render: (row) => (
          <div>
            <span className="font-bold text-sm text-foreground">
              {PLAN_TYPE_LABELS[row.plan_type] ?? row.plan_type}
            </span>
            <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              {new Date(row.start_date).toLocaleDateString("vi-VN")} – {new Date(row.end_date).toLocaleDateString("vi-VN")}
            </div>
          </div>
        ),
      },
      {
        key: "user_name",
        header: "Người dùng",
        render: (row) => (
          <div>
            <span className="text-xs font-bold text-foreground">{row.user_name ?? "—"}</span>
            <div className="text-[10px] font-semibold text-muted-foreground">{row.user_email ?? ""}</div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Trạng thái",
        render: (row) => {
          const colorClass = row.status ? STATUS_COLORS[row.status] ?? "bg-slate-500/10 text-slate-600 border-slate-500/20" : "bg-slate-500/10 text-slate-600 border-slate-500/20";
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${colorClass}`}>
              {row.status ? STATUS_LABELS[row.status] ?? row.status : "—"}
            </span>
          );
        },
      },
      {
        key: "item_count",
        header: "Tiến độ nấu",
        render: (row) => (
          <span className="text-xs font-bold text-foreground">
            {row.cooked_count}/{row.item_count}
          </span>
        ),
      },
      {
        key: "created_at",
        header: "Ngày tạo",
        render: (row) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {row.created_at ? new Date(row.created_at).toLocaleDateString("vi-VN") : "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        render: (row) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#7655aa] hover:bg-[#7655aa]/15"
              onClick={() => navigate(`/meal-plans/${row.id}`)}
              title="Xem chi tiết"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/15"
              onClick={() => setDeleteTarget(row)}
              title="Xóa kế hoạch"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Kế Hoạch Bữa Ăn"
        description="Theo dõi và quản lý các kế hoạch bữa ăn do người dùng tạo trong hệ thống."
      />

      <div className="space-y-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm theo tên hoặc email người dùng..."
        />
        <FilterBar
          filters={filterConfigs}
          onClearAll={() => setFilterStatus("ALL")}
        />
      </div>

      <div className="relative">
        <DataTable
          data={paginatedPlans}
          columns={columns}
          getRowId={(row) => String(row.id)}
          loading={loading}
          onRowClick={(row) => navigate(`/meal-plans/${row.id}`)}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="Không tìm thấy kế hoạch bữa ăn nào."
        />

        <Pagination
          total={filteredPlans.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {selectedIds.length > 0 && (
        <BulkActionBar
          count={selectedIds.length}
          onDelete={() => setBulkDeleteOpen(true)}
          onClear={() => setSelectedIds([])}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Xóa kế hoạch bữa ăn của "${deleteTarget?.user_name ?? "—"}"?`}
        description="Hành động này sẽ xóa vĩnh viễn kế hoạch bữa ăn này cùng toàn bộ các mục bên trong. Dữ liệu không thể khôi phục."
        primaryLabel="Xóa kế hoạch"
        type="destructive"
        onConfirm={handleDelete}
        isLoading={actionLoading}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Xóa loạt ${selectedIds.length} kế hoạch bữa ăn?`}
        description="Toàn bộ các kế hoạch đã chọn cùng các mục bên trong sẽ bị loại bỏ vĩnh viễn. Dữ liệu không thể khôi phục."
        primaryLabel="Xóa đồng loạt"
        type="destructive"
        onConfirm={handleBulkDelete}
        isLoading={actionLoading}
      />
    </div>
  );
}
export default MealPlanListPage;
