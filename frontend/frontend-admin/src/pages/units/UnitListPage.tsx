import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { adminUnitApi, type UnitWithCount } from "@/api/adminUnitApi";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { BulkActionBar } from "@/components/shared/BulkActionBar";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";

export function UnitListPage() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<UnitWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<UnitWithCount | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUnits = useCallback(async () => {
    setLoading(true);
    try {
      setUnits(await adminUnitApi.list());
    } catch {
      toast.error("Không thể tải danh sách đơn vị tính.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredUnits = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return units.filter(
      (u) => u.name.toLowerCase().includes(q) || u.symbol.toLowerCase().includes(q)
    );
  }, [units, searchQuery]);

  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUnits.slice(start, start + pageSize);
  }, [filteredUnits, currentPage, pageSize]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await adminUnitApi.delete(deleteTarget.id);
      toast.success(`Đã xóa đơn vị ${deleteTarget.name} thành công!`);
      setDeleteTarget(null);
      await loadUnits();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đã có lỗi xảy ra.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      await adminUnitApi.bulkDelete(selectedIds.map(Number));
      toast.success(`Đã xóa thành công ${selectedIds.length} đơn vị!`);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      await loadUnits();
    } catch {
      toast.error("Không thể xóa loạt đơn vị.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<UnitWithCount>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Tên đơn vị",
        sortable: true,
        render: (row) => <span className="font-bold text-sm text-foreground">{row.name}</span>,
      },
      {
        key: "symbol",
        header: "Ký hiệu",
        sortable: true,
        render: (row) => (
          <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-bold">{row.symbol}</span>
        ),
      },
      {
        key: "food_count",
        header: "Số thực phẩm",
        sortable: true,
        render: (row) => <span className="text-xs font-bold text-primary">{row.food_count}</span>,
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
              onClick={() => navigate(`/units/${row.id}`)}
              title="Chỉnh sửa"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/15"
              onClick={() => setDeleteTarget(row)}
              title="Xóa"
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
        title="Quản Lý Đơn Vị Tính"
        description="Danh mục đơn vị đo lường chuẩn hóa cho thực phẩm (bảng units)."
        actions={
          <Button
            onClick={() => navigate("/units/new")}
            className="bg-[#7655aa] hover:bg-[#67489a] font-bold rounded-[8px] flex items-center gap-1.5 h-10 px-4 text-white"
          >
            <Plus className="h-4 w-4" />
            Thêm đơn vị
          </Button>
        }
      />

      <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Tìm theo tên hoặc ký hiệu..." />

      <div className="relative">
        <DataTable
          data={paginatedUnits}
          columns={columns}
          getRowId={(row) => String(row.id)}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyMessage="Không tìm thấy đơn vị tính nào."
          emptyActionLabel="Thêm đơn vị mới"
          onEmptyAction={() => navigate("/units/new")}
        />
        <Pagination
          total={filteredUnits.length}
          page={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {selectedIds.length > 0 && (
        <BulkActionBar count={selectedIds.length} onDelete={() => setBulkDeleteOpen(true)} onClear={() => setSelectedIds([])} />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Xóa đơn vị ${deleteTarget?.name}?`}
        description="Không thể xóa nếu còn thực phẩm đang sử dụng đơn vị này."
        primaryLabel="Xóa đơn vị"
        type="destructive"
        onConfirm={handleDelete}
        isLoading={actionLoading}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Xóa loạt ${selectedIds.length} đơn vị?`}
        description="Toàn bộ đơn vị đã chọn sẽ bị loại bỏ vĩnh viễn."
        primaryLabel="Xóa đồng loạt"
        type="destructive"
        onConfirm={handleBulkDelete}
        isLoading={actionLoading}
      />
    </div>
  );
}
export default UnitListPage;
