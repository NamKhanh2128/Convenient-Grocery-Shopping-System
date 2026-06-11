import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminShoppingApi, type ShoppingListSummary } from "@/api/adminShoppingApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { FilterBar, type FilterConfig } from "@/components/shared/FilterBar";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  active: "Đang thực hiện",
  completed: "Hoàn thành",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const LIST_TYPE_LABELS: Record<string, string> = {
  daily: "Hàng ngày",
  weekly: "Hàng tuần",
};

export function ShoppingListPage() {
  const navigate = useNavigate();

  const [lists, setLists] = useState<ShoppingListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<ShoppingListSummary | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminShoppingApi.list();
      setLists(data);
    } catch (error) {
      toast.error("Không thể tải danh sách mua sắm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const filteredLists = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return lists.filter((l) => {
      const matchesSearch =
        l.name.toLowerCase().includes(q) ||
        (l.user_name ?? "").toLowerCase().includes(q) ||
        (l.user_email ?? "").toLowerCase().includes(q) ||
        (l.group_name ?? "").toLowerCase().includes(q);
      const matchesStatus = filterStatus === "ALL" || l.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [lists, searchQuery, filterStatus]);

  const paginatedLists = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLists.slice(start, start + pageSize);
  }, [filteredLists, currentPage, pageSize]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminShoppingApi.delete(deleteTarget.id);
      toast.success(`Đã xóa danh sách "${deleteTarget.name}" thành công!`);
      setDeleteTarget(null);
      await loadLists();
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
      await adminShoppingApi.bulkDelete(selectedIds.map(Number));
      toast.success(`Đã xóa thành công ${selectedIds.length} danh sách mua sắm!`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      await loadLists();
    } catch (error) {
      toast.error("Không thể xóa loạt danh sách mua sắm.");
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
        { label: "Đang thực hiện", value: "active" },
        { label: "Hoàn thành", value: "completed" },
      ],
    },
  ];

  const columns: Column<ShoppingListSummary>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Tên danh sách",
        sortable: true,
        render: (row) => (
          <div>
            <span className="font-bold text-sm text-foreground">{row.name}</span>
            <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              {LIST_TYPE_LABELS[row.list_type] ?? row.list_type}
            </div>
          </div>
        ),
      },
      {
        key: "user_name",
        header: "Người tạo",
        render: (row) => (
          <div>
            <span className="text-xs font-bold text-foreground">{row.user_name ?? "—"}</span>
            <div className="text-[10px] font-semibold text-muted-foreground">{row.user_email ?? ""}</div>
          </div>
        ),
      },
      {
        key: "group_name",
        header: "Nhóm gia đình",
        render: (row) => (
          <span className="text-xs font-semibold text-muted-foreground">{row.group_name ?? "—"}</span>
        ),
      },
      {
        key: "plan_date",
        header: "Ngày dự kiến",
        sortable: true,
        render: (row) => (
          <span className="text-xs font-semibold text-muted-foreground">
            {row.plan_date ? new Date(row.plan_date).toLocaleDateString("vi-VN") : "—"}
          </span>
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
        key: "assigned_user_name",
        header: "Người được giao",
        render: (row) => (
          <span className="text-xs font-semibold text-muted-foreground">{row.assigned_user_name ?? "—"}</span>
        ),
      },
      {
        key: "item_count",
        header: "Tiến độ",
        render: (row) => (
          <span className="text-xs font-bold text-foreground">
            {row.purchased_count}/{row.item_count}
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
              onClick={() => navigate(`/shopping-lists/${row.id}`)}
              title="Xem chi tiết"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/15"
              onClick={() => setDeleteTarget(row)}
              title="Xóa danh sách"
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
        title="Quản Lý Danh Sách Mua Sắm"
        description="Theo dõi và quản lý các danh sách mua sắm do người dùng tạo trong hệ thống."
      />

      <div className="space-y-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm theo tên danh sách, người tạo hoặc nhóm gia đình..."
        />
        <FilterBar
          filters={filterConfigs}
          onClearAll={() => setFilterStatus("ALL")}
        />
      </div>

      <div className="relative">
        <DataTable
          data={paginatedLists}
          columns={columns}
          getRowId={(row) => String(row.id)}
          loading={loading}
          onRowClick={(row) => navigate(`/shopping-lists/${row.id}`)}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="Không tìm thấy danh sách mua sắm nào."
        />

        <Pagination
          total={filteredLists.length}
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
        title={`Xóa danh sách "${deleteTarget?.name}"?`}
        description="Hành động này sẽ xóa vĩnh viễn danh sách mua sắm này cùng toàn bộ các mục bên trong. Dữ liệu không thể khôi phục."
        primaryLabel="Xóa danh sách"
        type="destructive"
        onConfirm={handleDelete}
        isLoading={actionLoading}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Xóa loạt ${selectedIds.length} danh sách mua sắm?`}
        description="Toàn bộ các danh sách đã chọn cùng các mục bên trong sẽ bị loại bỏ vĩnh viễn. Dữ liệu không thể khôi phục."
        primaryLabel="Xóa đồng loạt"
        type="destructive"
        onConfirm={handleBulkDelete}
        isLoading={actionLoading}
      />
    </div>
  );
}
export default ShoppingListPage;
